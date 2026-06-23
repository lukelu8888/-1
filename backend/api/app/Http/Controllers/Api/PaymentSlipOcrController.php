<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process;

class PaymentSlipOcrController
{
    public function recognize(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $uploadedFile = $validated['file'];
        $imagePath = $uploadedFile->getRealPath();
        if (!$imagePath || !is_file($imagePath)) {
            return response()->json([
                'message' => '未找到可识别的票据文件，请重新上传。',
            ], 422);
        }

        $repoRoot = dirname(base_path(), 2);
        $scriptPath = base_path('scripts/payment_slip_paddle_ocr.py');
        $pythonBinary = env('PADDLE_OCR_PYTHON_BIN', $repoRoot . '/.venv-paddle310/bin/python');
        $paddleHome = env('PADDLE_OCR_HOME', $repoRoot . '/.paddlex-home');
        $cacheHome = env('PADDLE_OCR_CACHE_HOME', $repoRoot . '/.paddlex-cache');

        if (!is_file($scriptPath)) {
            return response()->json([
                'message' => 'PaddleOCR 脚本不存在，请先完成本地部署。',
            ], 503);
        }

        if (!is_file($pythonBinary)) {
            return response()->json([
                'message' => 'PaddleOCR Python 环境未就绪，请先安装 .venv-paddle310。',
            ], 503);
        }

        if (!is_dir($paddleHome) && !mkdir($paddleHome, 0777, true) && !is_dir($paddleHome)) {
            return response()->json([
                'message' => '无法初始化 PaddleOCR 模型目录。',
            ], 500);
        }

        if (!is_dir($cacheHome) && !mkdir($cacheHome, 0777, true) && !is_dir($cacheHome)) {
            return response()->json([
                'message' => '无法初始化 PaddleOCR 缓存目录。',
            ], 500);
        }

        $process = new Process([$pythonBinary, $scriptPath, $imagePath], $repoRoot, [
            'HOME' => $paddleHome,
            'PADDLEX_HOME' => $paddleHome,
            'XDG_CACHE_HOME' => $cacheHome,
            'PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK' => 'True',
        ]);
        $process->setTimeout(120);

        try {
            $process->mustRun();
        } catch (ProcessFailedException $exception) {
            return response()->json([
                'message' => 'PaddleOCR 识别失败，请稍后重试。',
                'details' => trim($process->getErrorOutput() ?: $exception->getMessage()),
            ], 500);
        }

        $payload = json_decode($process->getOutput(), true);
        if (!is_array($payload) || !isset($payload['text'])) {
            return response()->json([
                'message' => 'PaddleOCR 返回结果格式异常。',
                'details' => trim($process->getOutput()),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'model' => 'paddleocr',
            'text' => (string) $payload['text'],
            'lines' => array_values(array_filter($payload['lines'] ?? [], fn ($line) => is_string($line) && trim($line) !== '')),
            'confidence' => isset($payload['confidence']) ? (float) $payload['confidence'] : null,
            'extracted' => is_array($payload['extracted'] ?? null) ? $payload['extracted'] : null,
        ]);
    }
}
