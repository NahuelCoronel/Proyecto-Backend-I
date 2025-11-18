import {Router} from "express";
import fs from 'fs/promises';

const route = Router();


// La función writeData encapsula la lógica para escribir en el disco.
async function writeData(path, data) {
    try {
        // 1. Convertir el objeto/array de JavaScript a formato JSON (texto)
        const jsonString = JSON.stringify(data, null, 2); 
        
        // 2. Usar fs.writeFile para guardar el texto en la ruta especificada.
        await fs.writeFile(path, jsonString, 'utf-8');
        
    } catch (error) {
        // Manejo de errores de escritura
        console.error(`Error al escribir en el archivo ${path}:`, error.message);
        throw error;
    }
}


async function readData(path) {
    try {
        const data = await fs.readFile(path, 'utf-8'); 
        return JSON.parse(data);
    } catch (error) {
        // Devuelve array vacío si el archivo no existe (ENOENT) o está vacío
        if (error.code === 'ENOENT' || error.message.includes('Unexpected end of JSON input')) {
            return [];
        }
        console.error(`Error al leer el archivo ${path}:`, error.message);
        throw error;
    }
}

const getNextId=(array) => {
    if (array.length === 0) return 1;
    // Encuentra el ID más alto y le suma 1
    const maxId = array.reduce((max, item) => (item.id > max ? item.id : max), 0);
    return maxId + 1;
}

const CARRITOS_PATH = '../data/carritos.json';

//Crear un nuevo carrito
route.post('/', async (req, res) => {
    try{
        const carritos = await readData(CARRITOS_PATH)
        
        const newCarrito = {
            id: getNextId(carritos),    
            products: []
        }

        carritos.push(newCarrito)
        await writeData(CARRITOS_PATH,carritos)
        res.status(201).json(newCarrito)

    } catch (error) {
        res.status(500).json({error: "Error al crear el carrito."})
    }
    
})


//Listar productos de un carrito
route.get('/:cid', async (req, res) => {
    try{
        const carritos = await readData(CARRITOS_PATH)
        const cartId = parseInt(req.params.cid);
    
        const cart = carritos.find(c => c.id === cartId);

        if (!cart) {
            return res.status(404).json({ error: "Carrito no encontrado." });
        }

        res.json(cart.products);
    } catch (error){
        res.status(500).json({error: "Error al listar el carrito."})
    }
    
})


//Agregar producto al carrito
route.post('/:cid/product/:pid', async (req, res) => {
    try{
        const carritos = await readData(CARRITOS_PATH)
        const cartId = parseInt(req.params.cid);
        const productId = parseInt(req.params.pid);
        

        // 1. Buscar el carrito
        const cart = carritos.find(c => c.id === cartId);
        if (!cart) {
            return res.status(404).json({ error: "Carrito no encontrado." });
        }

        // 2. Buscar si el producto ya está en el array 'products' del carrito
        const existingProductInCart = cart.products.find(p => p.product === productId);
        
        if (existingProductInCart) {
            // 3a. Si existe, incrementar la cantidad
            existingProductInCart.quantity += 1;
        } else {
            // 3b. Si no existe, agregarlo con quantity: 1
            cart.products.push({
                product: productId, 
                quantity: 1         
            });
        }

        await writeData(CARRITOS_PATH,carritos)
        
        // 4. Devolver la vista actualizada del carrito
        res.json({ 
            message: `Producto ${productId} agregado/actualizado en el carrito ${cartId}.`, 
            cart: cart 
        });

    } catch(error){
        res.status(500).json({error : "Error al actualizar el carrito"})
    }
    
});



export default route;