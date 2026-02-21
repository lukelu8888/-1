<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:64'],
        ]);

        /** @var User|null $user */
        $user = User::query()->where('email', $validated['email'])->first();
        if (!$user) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $plain = (string) $validated['password'];

        // Support both hashed password (target) and legacy plain password (for demo seed).
        $storedPassword = (string) $user->password;
        $ok = false;

        // In newer Laravel versions, bcrypt hasher may throw if stored hash algorithm doesn't match.
        // Our demo seed may store plain password in `users.password`, so we must not hard-fail here.
        try {
            $ok = Hash::check($plain, $storedPassword);
        } catch (RuntimeException) {
            $ok = false;
        }

        if (!$ok && $storedPassword !== '' && !str_starts_with($storedPassword, '$')) {
            $ok = hash_equals($storedPassword, $plain);
        }

        if (!$ok && !empty($user->password_plain)) {
            $ok = hash_equals((string) $user->password_plain, $plain);
        }

        if (!$ok) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        // Auto-upgrade: if DB still stores plain, keep it in password_plain and write hash into password.
        if ($storedPassword !== '' && !str_starts_with($storedPassword, '$')) {
            if (empty($user->password_plain)) {
                $user->password_plain = $storedPassword;
            }
            $user->password = Hash::make($plain);
        } elseif (!empty($user->password_plain) && Hash::needsRehash($storedPassword)) {
            // If password column contains an old hash format, you may rehash here.
            $user->password = Hash::make($plain);
        }

        $user->last_login_at = now();
        $user->save();

        $tokenName = $validated['device_name'] ?? 'api';
        $token = $user->createToken($tokenName)->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->user()?->currentAccessToken();
        if ($token) {
            $token->delete();
        }

        return response()->json(['message' => 'Logged out.']);
    }
}

