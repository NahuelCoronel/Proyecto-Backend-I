import {Router} from "express";
import fs from 'fs/promises';

export default function (io){
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


    const PRODUCTOS_PATH = "../data/productos.json";

    // Listar todos los productos
    route.get('/', async (req, res) => {   
        try{
            const productos = await readData(PRODUCTOS_PATH)
            res.json(productos);
        } catch(error){
            res.status(500).json({error: "Error al obtener los productos"})
        }
    });

    // Listar producto determinado
    route.get('/:pid', async (req, res) => {
        try{
            const productos = await readData(PRODUCTOS_PATH)
            const productId = req.params.pid;
            // Aseguramos que el id buscado sea un número para la comparación
            const producto = productos.find(p=>p.id===parseInt(productId)) 

            if (!producto){
                return res.status(404).json({error: "Producto no encontrado"})
            } else {
                res.json(producto)
            }
            
        } catch (error){
            res.status(500).json({error: "Error al obtener el producto"})
        }        
    });


    // Agregar un nuevo producto
    route.post('/', async (req, res) => {
        
        try{
            const productos = await readData(PRODUCTOS_PATH)
            const newProductData = req.body;
        
            // 'stock' ha sido eliminado de los campos requeridos.
            const requiredFields = ['title', 'description', 'code', 'price', 'category'];
            const missingFields = requiredFields.filter(field => newProductData[field] === undefined);

            if (missingFields.length > 0) {
                return res.status(400).json({ 
                    error: `Faltan los siguientes campos obligatorios: ${missingFields.join(', ')}`
                });
            }
            
            // VALIDACIÓN DE TIPO PARA PRICE (Crucial)
            const price = Number(newProductData.price);

            if (isNaN(price) || price <= 0) {
                return res.status(400).json({ error: "El campo 'price' debe ser un número positivo." });
            }
            
            // Si todo está bien, construimos el nuevo producto
            const newProduct = {
                id: getNextId(productos),     
                title: newProductData.title,
                description: newProductData.description,
                code: newProductData.code,
                price: price, // Usamos el número validado
                status: newProductData.status !== undefined ? newProductData.status : true,
                category: newProductData.category,
                // Stock ya no se incluye
                thumbnails: newProductData.thumbnails || [],
            };

            productos.push(newProduct);
            await writeData(PRODUCTOS_PATH,productos);
            io.emit('productoAgregado', newProduct);
            res.status(201).json(newProduct);

        } catch (error){
            console.error("Error en POST /api/productos:", error);
            res.status(500).json({error: "Error al agregar un producto"})
        }
        
    });


    // Actualizar un producto
    route.put('/:pid', async (req, res) => {
        try{
            const productos = await readData(PRODUCTOS_PATH)
            const productId = parseInt(req.params.pid);
            const updateData = req.body;

            if (updateData.id) {
                delete updateData.id;
            }

            const productIndex = productos.findIndex(p => p.id === productId);

            if (productIndex === -1) {
                return res.status(404).json({ error: "Producto no encontrado para actualizar." });
            }

            // Aplicamos la actualización
            let updatedProduct = {
                ...productos[productIndex],
                ...updateData
            };
            
            // Validamos y convertimos price si está presente en la actualización
            if (updatedProduct.price !== undefined) {
                const newPrice = Number(updatedProduct.price);
                if (isNaN(newPrice) || newPrice <= 0) {
                    return res.status(400).json({ error: "El campo 'price' debe ser un número positivo." });
                }
                updatedProduct.price = newPrice;
            }

            // Se elimina la validación de 'stock'

            productos[productIndex] = updatedProduct;

            await writeData(PRODUCTOS_PATH,productos)
            io.emit('productoActualizado', updatedProduct);

            res.json({ 
                message: "Producto actualizado con éxito.", 
                product: updatedProduct
            });

        } catch (error) {
            console.error("Error en PUT /api/productos:", error);
            res.status(500).json({error: "Error al actualizar un producto"})
        }
        
    });


    // Eliminar el producto
    route.delete('/:pid', async (req, res) => {

        try {
            let productos = await readData(PRODUCTOS_PATH)
            const productId = parseInt(req.params.pid);
        
            const initialLength = productos.length;
            
            productos = productos.filter(p => p.id !== productId);

            if (productos.length === initialLength) {
                return res.status(404).json({ error: "Producto no encontrado para eliminar." });
            }

            await writeData(PRODUCTOS_PATH, productos)

            io.emit('productoEliminado', productId);

            res.json({ message: `Producto con ID ${productId} eliminado correctamente.` });
        } catch (error) {
            res.status(500).json({error: "Error al eliminar un producto"})
        }
        
    });


    return route;
}
