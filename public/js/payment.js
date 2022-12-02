// Test API key, tenabang api will go here
const stripe = Stripe("_tenabang_APi_key_sdfwHYgOPObuSAD");


const items = [{ id: "item" }];

let elements;

initialize();
checkStatus();

document
  .querySelector("#payment-form")
  .addEventListener("submit", handleSubmit);



// Fetches a payment intent and captures the client secret
async function initialize() {
  const { clientSecret } = await fetch("/create.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  }).then((r) => r.json());

  elements = stripe.elements({ clientSecret });

  const paymentElementOptions = {
    layout: "tabs",
  };

  const paymentElement = elements.create("payment", paymentElementOptions);
  paymentElement.mount("#payment-element");
}

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      //When Payment complete redirect to completion page
	  return_url: "confirmation.html",
    },
  });

  // Exception handling, incase of any errors
  if (error.type === "card_error" || error.type === "validation_error") {
    showMessage(error.message);
  } else {
    showMessage("An unexpected error occurred.");
  }

  setLoading(false);
}

// get intent status after submission
async function checkStatus() {
  const clientSecret = new URLSearchParams(window.location.search).get(
    "payment_intent_client_secret"
  );

  if (!clientSecret) {
    return;
  }

  const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

  switch (paymentIntent.status) {
    case "succeeded":
      showMessage("Payment successful");
      break;
    case "processing":
      showMessage("Processing payment");
      break;
    case "requires_payment_method":
      showMessage("Could not complete payment, please try again.");
      break;
    default:
      showMessage("An error Occured");
      break;
  }
}

// ------- UI helpers -------

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add("hidden");
    messageText.textContent = "";
  }, 4000);
}


// Show a spinner on payment submission
function setLoading(isLoading) {
  if (isLoading) {

	 
	// When loading Disable the button and show a spinner
    document.querySelector("#submit").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");	
	
	window.location.href = 'confirmation.html';


  } else {
    document.querySelector("#submit").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
}