<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    private function canViewSuppliers(Request $request): bool
    {
        $user = $request->user();
        if (!$user) return false;

        $portalRole = (string) ($user->portal_role ?? '');
        if ($portalRole === 'admin') return true;

        $rbacRole = (string) ($user->rbac_role ?? '');
        return in_array($rbacRole, ['Procurement', 'Finance', 'CFO', 'CEO', 'Admin'], true);
    }

    /**
     * List suppliers from DB organizations table.
     * GET /api/suppliers
     */
    public function index(Request $request)
    {
        if (!$this->canViewSuppliers($request)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $q = Organization::query()
            ->where('org_type', 'supplier')
            ->where('status', 'active')
            ->orderBy('level', 'asc')
            ->orderBy('name', 'asc');

        if ($request->filled('q') && is_string($request->query('q'))) {
            $kw = trim((string) $request->query('q'));
            if ($kw !== '') {
                $q->where(function ($sub) use ($kw) {
                    $sub->where('name', 'like', '%' . $kw . '%')
                        ->orWhere('name_en', 'like', '%' . $kw . '%')
                        ->orWhere('company_id', 'like', '%' . $kw . '%')
                        ->orWhere('region', 'like', '%' . $kw . '%')
                        ->orWhere('email', 'like', '%' . $kw . '%')
                        ->orWhere('contact_person', 'like', '%' . $kw . '%')
                        ->orWhere('phone', 'like', '%' . $kw . '%');
                });
            }
        }

        $suppliers = $q->limit(1000)->get();

        return response()->json([
            'suppliers' => $suppliers->map(fn (Organization $o) => [
                'id' => (string) ($o->company_id ?? $o->id),
                'code' => (string) ($o->company_id ?? ''),
                'name' => $o->name,
                'nameEn' => $o->name_en,
                'level' => $o->level,
                'category' => $o->industry,
                'region' => $o->region,
                'contact' => $o->contact_person,
                'phone' => $o->phone,
                'email' => $o->email,
                'address' => $o->address,
                'status' => $o->status,
            ])->values(),
        ]);
    }
}

