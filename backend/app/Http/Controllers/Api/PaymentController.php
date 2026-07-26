<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\InvalidWebhookException;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function store(Order $order, PaymentService $service): JsonResponse
    {
        Gate::authorize('pay', $order);
        $session = $service->start($order);

        return response()->json([
            'data' => ['checkout_url' => $session['url'], 'session_id' => $session['id']],
        ], 201);
    }

    public function stripeWebhook(Request $request, PaymentService $service): JsonResponse
    {
        try {
            $result = $service->handleWebhook(
                $request->getContent(),
                (string) $request->header('Stripe-Signature'),
            );
        } catch (InvalidWebhookException|ValidationException) {
            return response()->json(['message' => 'Invalid webhook request.'], 400);
        }

        return response()->json(['received' => true] + $result);
    }
}
