<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        Auth::login($user);
        $user->assignRole('student');
        $request->session()->regenerate();
        event(new Registered($user));

        return response()->json([
            'message' => 'Account created successfully.',
            'user' => $user->load('roles:id,name'),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Signed in successfully.',
            'user' => $request->user()->load('roles:id,name'),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();
        Auth::forgetGuards();

        return response()->json([
            'message' => 'Signed out successfully.',
        ]);
    }
}
