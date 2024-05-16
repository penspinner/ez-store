import { items } from '#app/items.js'
import { LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { ClientActionFunctionArgs, Form, Link, redirect, useLoaderData } from '@remix-run/react'
import { addProductToCart } from '#app/db.js'
import { z } from 'zod'
import { parseWithZod } from '@conform-to/zod'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: data ? data.product.name : 'Product' }]
}

export function loader({ params, response }: LoaderFunctionArgs) {
  const { productId } = params
  const product = items.find((item) => item.id === productId)

  if (!product) {
    response!.status = 404
    throw response
  }

  return { product }
}

const productSchema = z.object({ quantity: z.number() })

export async function clientAction({ params, request }: ClientActionFunctionArgs) {
  if (!params.productId) {
    return { error: 'Product ID is required' }
  }

  const parsed = parseWithZod(await request.formData(), { schema: productSchema })

  if (parsed.status !== 'success') {
    return { lastResult: parsed.reply() }
  }

  await addProductToCart(params.productId, parsed.value.quantity)
  return redirect('/cart')
}

export default function ProductPage() {
  const { product } = useLoaderData<typeof loader>()
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div>
          <Link to="/products">Products</Link>
        </div>
        <div className="mt-10 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
          <div>
            <img
              src={product.imageUrl}
              alt=""
              className="h-full w-full object-cover object-center sm:rounded-lg"
            />
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.name}</h1>

            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl tracking-tight text-gray-900">{product.price}</p>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <p className="space-y-6 text-base text-gray-700">{product.description}</p>
            </div>

            <Form className="mt-10" method="POST">
              <div className="flex gap-2">
                <div>
                  <label htmlFor="quantity" className="sr-only">
                    Quantity, {product.name}
                  </label>
                  <select
                    id="quantity"
                    name="quantity"
                    className="max-w-full rounded-md border border-gray-300 py-2 text-left text-base font-medium leading-5 text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                    <option value={7}>7</option>
                    <option value={8}>8</option>
                  </select>
                </div>
                <div>
                  <button
                    type="submit"
                    className="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 sm:w-full"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}
