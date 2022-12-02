<?php

require 'vendor/autoload.php';

// Test API key, tenabang api will go here
\Stripe\Stripe::setApiKey('_tenabang_APi_key_sdfwHYgOPObuSAD');

function calculateOrderAmount(array $items): int {
	// No longer in use
    return items;
}

header('Content-Type: application/json');

try {
	// get the JSON from the payment.js (the POST body)
    $jsonStr = file_get_contents('php://input');
    $jsonObj = json_decode($jsonStr);


	//Get the amount to be paid
	var cart_price = sessionStorage.getItem("cart_price");

    // Use the amount received and currency to create a new Payment Intent, IDR for indonesian Rupiah
    $paymentIntent = \Stripe\PaymentIntent::create([
        'amount' => cart_price,
        'currency' => 'idr',
        'automatic_payment_methods' => [
            'enabled' => true,
        ],
    ]);

    $output = [
        'clientSecret' => $paymentIntent->client_secret,
    ];

    echo json_encode($output);
} catch (Error $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}