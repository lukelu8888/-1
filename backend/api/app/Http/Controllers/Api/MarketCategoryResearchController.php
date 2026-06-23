<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Market Category Research API  (prefix: /api/mcr, auth:sanctum)
 */
class MarketCategoryResearchController extends Controller
{
    public function kpis(): JsonResponse
    {
        return response()->json([
            'total_runs'                 => DB::table('mcr_runs')->count(),
            'pending_review'             => DB::table('mcr_candidates')->where('status','needs_review')->count(),
            'approved'                   => DB::table('mcr_candidates')->where('status','approved')->count(),
            'published'                  => DB::table('mcr_candidates')->where('status','published')->count(),
            'watchlist'                  => DB::table('mcr_candidates')->where('status','watchlist')->count(),
            'high_confidence_candidates' => DB::table('mcr_candidates')->where('score_confidence','>=',85)->count(),
        ]);
    }

    public function indexRuns(): JsonResponse
    {
        return response()->json(DB::table('mcr_runs')->orderByDesc('created_at')->get());
    }

    public function storeRun(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'               => 'required|string|max:255',
            'source_category'     => 'required|string|max:255',
            'region'              => 'required|string',
            'country'             => 'required|string',
            'audience'            => 'required|in:b2b,b2c,both',
            'requested_level'     => 'required|in:L1,L2,L3,L4',
            'time_windows'        => 'required|array|min:1',
            'time_windows.*'      => 'in:10Y,5Y,3Y,1Y,3M',
            'data_sources'        => 'required|array|min:1',
            'data_sources.*'      => 'in:google_trends,merchant_center,amazon_oe,retailer_scan,google_shopping,manual',
            'benchmark_retailers' => 'nullable|array',
            'notes'               => 'nullable|string',
        ]);

        $id = Str::uuid()->toString();
        DB::table('mcr_runs')->insert([
            'id'                   => $id,
            'title'                => $data['title'],
            'source_category'      => $data['source_category'],
            'region'               => $data['region'],
            'country'              => $data['country'],
            'audience'             => $data['audience'],
            'requested_level'      => $data['requested_level'],
            'time_windows'         => json_encode($data['time_windows']),
            'data_sources'         => json_encode($data['data_sources']),
            'benchmark_retailers'  => json_encode($data['benchmark_retailers'] ?? []),
            'notes'                => $data['notes'] ?? null,
            'status'               => 'draft',
            'candidate_count'      => 0,
            'pending_review_count' => 0,
            'created_by'           => $request->user()?->email,
            'created_at'           => now(),
            'updated_at'           => now(),
        ]);

        return response()->json(DB::table('mcr_runs')->find($id), 201);
    }

    public function showRun(string $id): JsonResponse
    {
        $run = DB::table('mcr_runs')->find($id);
        if (!$run) return response()->json(['message' => 'Not found'], 404);
        return response()->json($run);
    }

    public function startRun(Request $request, string $id): JsonResponse
    {
        $run = DB::table('mcr_runs')->find($id);
        if (!$run) return response()->json(['message' => 'Not found'], 404);
        if ($run->status !== 'draft') {
            return response()->json(['message' => 'Run is not in draft status'], 422);
        }

        DB::table('mcr_runs')->where('id', $id)->update(['status' => 'running', 'updated_at' => now()]);
        $this->dispatchResearchJob($id);
        return response()->json(DB::table('mcr_runs')->find($id));
    }

    private function dispatchResearchJob(string $runId): void
    {
        $scriptPath  = base_path('scripts/mcr_research_runner.py');
        if (!file_exists($scriptPath)) { Log::warning("MCR script missing: {$scriptPath}"); return; }

        $supabaseUrl = env('SUPABASE_URL', '');
        $supabaseKey = env('SUPABASE_SERVICE_ROLE_KEY', '');
        $logFile     = '/tmp/mcr_run_' . $runId . '.log';

        exec(sprintf(
            'python3 %s --run-id %s --supabase-url %s --supabase-key %s >> %s 2>&1 &',
            escapeshellarg($scriptPath), escapeshellarg($runId),
            escapeshellarg($supabaseUrl), escapeshellarg($supabaseKey),
            escapeshellarg($logFile)
        ));
        Log::info("MCR: dispatched research job for run {$runId}");
    }

    public function indexCandidates(Request $request): JsonResponse
    {
        $q = DB::table('mcr_candidates');
        if ($request->filled('run_id')) $q->where('run_id', $request->run_id);
        if ($request->filled('status'))  $q->where('status', $request->status);
        return response()->json($q->orderByDesc('score_confidence')->get());
    }

    public function showCandidate(string $id): JsonResponse
    {
        $c = DB::table('mcr_candidates')->find($id);
        if (!$c) return response()->json(['message' => 'Not found'], 404);
        $c->hot_products = DB::table('mcr_hot_products')->where('candidate_id',$id)->orderBy('rank')->get();
        return response()->json($c);
    }

    public function updateCandidateStatus(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'status'       => 'required|in:candidate,needs_review,approved,rejected,watchlist',
            'review_notes' => 'nullable|string',
        ]);
        $c = DB::table('mcr_candidates')->find($id);
        if (!$c) return response()->json(['message' => 'Not found'], 404);
        DB::table('mcr_candidates')->where('id',$id)->update([
            'status'       => $data['status'],
            'review_notes' => $data['review_notes'] ?? $c->review_notes,
            'reviewed_by'  => $request->user()?->email,
            'reviewed_at'  => in_array($data['status'],['approved','rejected']) ? now() : null,
            'updated_at'   => now(),
        ]);
        return response()->json(DB::table('mcr_candidates')->find($id));
    }

    public function indexEvidence(Request $request): JsonResponse
    {
        $q = DB::table('mcr_evidence');
        if ($request->filled('candidate_id')) $q->where('candidate_id', $request->candidate_id);
        return response()->json($q->orderByDesc('fetched_at')->get());
    }

    public function storeEvidence(Request $request): JsonResponse
    {
        $data = $request->validate([
            'candidate_id'    => 'required|string',
            'source'          => 'required|in:google_trends,merchant_center,amazon_oe,retailer_scan,google_shopping,manual',
            'source_label'    => 'required|string',
            'title'           => 'required|string',
            'summary'         => 'nullable|string',
            'evidence_status' => 'required|in:market_verified,cross_verified,single_source,fallback,manual',
            'metrics'         => 'nullable|array',
            'url'             => 'nullable|string',
        ]);
        $id = Str::uuid()->toString();
        DB::table('mcr_evidence')->insert([
            'id'               => $id,
            'candidate_id'     => $data['candidate_id'],
            'source'           => $data['source'],
            'source_label'     => $data['source_label'],
            'title'            => $data['title'],
            'summary'          => $data['summary'] ?? null,
            'evidence_status'  => $data['evidence_status'],
            'metrics'          => isset($data['metrics']) ? json_encode($data['metrics']) : null,
            'url'              => $data['url'] ?? null,
            'raw_payload_hash' => 'sha256:' . hash('sha256', json_encode($data)),
            'fetched_at'       => now(),
            'created_at'       => now(),
        ]);
        return response()->json(DB::table('mcr_evidence')->find($id), 201);
    }

    public function retailerScans(string $candidateId): JsonResponse
    {
        return response()->json(
            DB::table('mcr_retailer_scans')->where('candidate_id',$candidateId)->orderByDesc('confidence')->get()
        );
    }

    public function reviewQueue(): JsonResponse
    {
        return response()->json(
            DB::table('mcr_candidates')->where('status','needs_review')->orderByDesc('score_confidence')->get()
        );
    }

    public function publish(Request $request): JsonResponse
    {
        $data = $request->validate([
            'candidate_id'         => 'required|string',
            'parent_category_id'   => 'nullable|string',
            'parent_category_name' => 'nullable|string',
            'seo_title'            => 'nullable|string',
        ]);

        $c = DB::table('mcr_candidates')->find($data['candidate_id']);
        if (!$c) return response()->json(['message' => 'Candidate not found'], 404);
        if ($c->status !== 'approved') return response()->json(['message' => 'Only approved candidates can be published.'], 422);
        if (!DB::table('mcr_evidence')->where('candidate_id',$c->id)->count()) {
            return response()->json(['message' => 'No evidence attached — publish blocked.'], 422);
        }

        $targetPath = isset($data['parent_category_name'])
            ? $data['parent_category_name'] . ' > ' . $c->name_en
            : $c->name_en;
        $catId = 'cat-' . Str::slug($c->name_en) . '-' . substr($c->id, 0, 8);

        if (Schema::hasTable('categories')) {
            DB::table('categories')->insertOrIgnore([
                'id' => Str::uuid()->toString(), 'name' => $c->name_en, 'name_zh' => $c->name_zh ?? null,
                'slug' => Str::slug($c->name_en), 'parent_id' => $data['parent_category_id'] ?? null,
                'level' => $c->suggested_level, 'seo_title' => $data['seo_title'] ?? $c->name_en,
                'source' => 'mcr', 'source_id' => $c->id, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        DB::table('mcr_candidates')->where('id',$c->id)->update([
            'status' => 'published', 'published_category_id' => $catId, 'published_at' => now(), 'updated_at' => now(),
        ]);

        $logId = Str::uuid()->toString();
        DB::table('mcr_publish_logs')->insert([
            'id' => $logId, 'candidate_id' => $c->id, 'candidate_name' => $c->name_en,
            'published_at' => now(), 'published_by' => $request->user()?->email ?? 'system',
            'target_category_id' => $catId, 'target_path' => $targetPath,
            'seo_title' => $data['seo_title'] ?? null, 'parent_category_id' => $data['parent_category_id'] ?? null,
            'created_at' => now(),
        ]);

        Log::info("MCR: published '{$c->name_en}' → {$targetPath}");
        return response()->json(DB::table('mcr_publish_logs')->find($logId), 201);
    }

    public function publishLogs(): JsonResponse
    {
        return response()->json(DB::table('mcr_publish_logs')->orderByDesc('published_at')->get());
    }
}
