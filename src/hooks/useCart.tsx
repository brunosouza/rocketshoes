import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productData = await api.get(`products/${productId}`);
      if (productData.status !== 200) {
        toast.error("Erro na adição do produto");
        return;
      }
      if (!cart.find((product) => product.id === productId)) {
        const product = {
          id: productData.data.id,
          amount: 1,
          title: productData.data.title,
          image: productData.data.image,
          price: productData.data.price,
        };
        setCart([...cart, product]);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify([...cart, product])
        );
      } else {
        const { data } = await api.get<Stock>(`stock/${productId}`);
        const cartProducts = cart;

        cartProducts.forEach((product) => {
          if (product.id === productId) {
            if (product.amount < data.amount) {
              product.amount++;
              setCart([...cartProducts]);
              localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
            } else {
              toast.error("Quantidade solicitada fora de estoque");
            }
          }
        });
      }
      // return;
      // TODO
    } catch {
      toast.error("Erro na adição do produto");
      // TODO
    }
  };

  const removeProduct = (productId: number) => {
    const cartProducts = cart;
    if (
      cartProducts.find((product) => product.id === productId) === undefined
    ) {
      toast.error("Erro na remoção do produto");
      return;
    }
    try {
      const updateCart = cartProducts.filter(
        (product) => product.id !== productId
      );
      setCart(updateCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
      // TODO
    } catch {
      toast.error("Erro na remoção do produto");
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount <= 0) {
      return;
    }
    try {
      const { data } = await api.get<Stock>(`stock/${productId}`);
      const cartProducts = cart;

      if (amount <= data.amount) {
        cartProducts.forEach((product) => {
          if (product.id === productId) product.amount = amount;
        });
        setCart([...cartProducts]);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartProducts));
      } else {
        toast.error("Quantidade solicitada fora de estoque");
      }
      // TODO
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
      return;
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
