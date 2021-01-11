const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
require("dotenv").config()

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

const app = express()
app.use(bodyParser.json())
app.use(cors())

// Functions
const fetchActiveProducts = async () => {
  const products = await stripe.products.list()

  const activeProducts = products.data
    .filter((product) => product.active === true)
    .map((product) => {
      return {
        id: product.id,
        created: product.created,
        description: product.description,
        images: product.images,
        metadata: product.metadata,
        name: product.name,
      }
    })

  return activeProducts
}

const fetchActivePrices = async () => {
  const prices = await stripe.prices.list()

  const activePrices = prices.data
    .filter((price) => price.active === true)
    .map((price) => {
      return {
        id: price.id,
        created: price.created,
        currency: price.currency,
        metadata: price.metadata,
        product: price.product,
        recurring: price.recurring,
        type: price.type,
        unit_amount: price.unit_amount,
      }
    })

  return activePrices
}

const fetchActiveProductsWithPrices = async () => {
  const pricesWithProductData = await stripe.prices.list({
    expand: ["data.product"],
  })

  const activeProductsWithPrices = pricesWithProductData.data
    .filter((price) => price.active === true)
    .map(
      ({
        product,
        id,
        created,
        currency,
        metadata,
        recurring,
        type,
        unit_amount,
      }) => {
        return {
          productData: {
            id: product.id,
            created: product.created,
            description: product.description,
            images: product.images,
            metadata: product.metadata,
            name: product.name,
          },
          priceData: {
            id,
            created,
            currency,
            metadata,
            recurring,
            type,
            unit_amount,
          },
        }
      }
    )

  return activeProductsWithPrices
}

const createSubscriptionCheckout = async (priceID, customerID) => {
  const checkout = await stripe.checkout.sessions.create({
    success_url: "https://example.com/success",
    cancel_url: "https://example.com/cancel",
    payment_method_types: ["card"],
    line_items: [{ price: priceID, quantity: 1 }],
    mode: "subscription",
    customer: customerID,
  })

  return checkout
}

const createCustomerBillingPortal = async (customerID) => {
  const customerPortal = await stripe.billingPortal.sessions.create({
    customer: customerID,
    return_url: "https://example.com/account",
  })

  return customerPortal
}

const createSubscriptionAndBillingPortal = async (customerID, priceID) => {
  const customerPortal = await stripe.billingPortal.sessions.create({
    customer: customerID,
    return_url: "http://webing05.vot.pl",
  })

  const checkout = await stripe.checkout.sessions.create({
    success_url: customerPortal.url,
    cancel_url: customerPortal.url,
    payment_method_types: ["card"],
    line_items: [{ price: priceID, quantity: 1 }],
    mode: "subscription",
    customer: customerID,
  })

  return checkout
}

// Routes
app.get("/", (req, res) => {
  res.send("hello world")
})

app.get("/only-active-products", async (req, res) => {
  res.json(await fetchActiveProducts())
})

app.get("/only-active-prices", async (req, res) => {
  res.json(await fetchActivePrices())
})

app.get("/products", async (req, res) => {
  res.json(await fetchActiveProductsWithPrices())
})

app.post("/create-subscription-checkout", async (req, res) => {
  res.json(
    await createSubscriptionCheckout(req.body.priceID, req.body.customerID)
  )
})

app.post("/create-customer-portal", async (req, res) => {
  res.json(await createCustomerBillingPortal(req.body.customerID))
})

app.post("/create-checkout-and-portal", async (req, res) => {
  res.json(
    await createSubscriptionAndBillingPortal(
      req.body.customerID,
      req.body.priceID
    )
  )
})

app.listen(80, () => {
  console.log(`Example app listening at port 80 which is default`)
})
