import localforage from 'localforage'
import { z } from 'zod'

async function setCart(cart: z.infer<typeof cartSchema>) {
  await localforage.setItem('ez-cart', cart)
}

const cartSchema = z.array(
  z.object({
    id: z.string().min(1),
    quantity: z.number().min(0),
  }),
)

export async function getOrCreateCart() {
  const cart = await localforage.getItem('ez-cart')
  const parsed = cartSchema.safeParse(cart)
  let parsedCart = parsed.data

  if (!parsedCart) {
    parsedCart = []
    await setCart(parsedCart)
  }

  return parsedCart
}

export async function addProductToCart(productId: string, quantity: number) {
  const cart = await getOrCreateCart()
  const productInCart = cart.find((product) => product.id === productId)

  if (productInCart) {
    productInCart.quantity += quantity
  } else {
    cart.push({ id: productId, quantity: quantity })
  }

  await setCart(cart)
}

export async function removeProductFromCart(productId: string) {
  const cart = await getOrCreateCart()
  const newCart = cart.filter((product) => product.id !== productId)
  await setCart(newCart)
}

const ordersSchema = z.array(z.object({ cart: cartSchema, dateOrdered: z.date(), id: z.string() }))

export async function getOrders() {
  const parsed = ordersSchema.safeParse(await localforage.getItem('ez-orders'))
  const orders = parsed.success ? parsed.data : []
  return orders
}

export async function checkout() {
  const [cart, orders] = await Promise.all([getOrCreateCart(), getOrders()])
  const order = { cart, dateOrdered: new Date(), id: crypto.randomUUID() }
  orders.push(order)
  await Promise.all([localforage.setItem('ez-orders', orders), localforage.setItem('ez-cart', [])])
  return order
}

export async function getOrder(orderId: string) {
  const orders = await getOrders()
  const order = orders.find((o) => o.id === orderId)
  return order
}
