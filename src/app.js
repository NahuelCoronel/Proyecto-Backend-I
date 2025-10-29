const express = require('express');
const app = express();
const PORT = 8080;



app.use(express.json());


let productos =  [
    {
        id: 1, 
        title: "Empanada de Carne",
        description: "Relleno tradicional con carne, cebolla, morrón y aceitunas.",
        code: "EMP-CARNE",
        price: 1500,
        status: true,
        stock: 50,
        category: "Saladas",
        thumbnails: ["imagenesEmpanadas/carne.jpg"] 
    },
    {
        id: 2, 
        title: "Empanada de Pollo",
        description: "Relleno suave de pollo, cebolla y morrón. Ideal para todos los gustos.",
        code: "EMP-POLLO",
        price: 1500,
        status: true,
        stock: 45,
        category: "Saladas",
        thumbnails: ["imagenesEmpanadas/pollo.jpg"]
    },
    {
        id: 3, 
        title: "Empanada de Jamón y Queso",
        description: "El clásico favorito con jamón, queso mozzarella y un toque de orégano.",
        code: "EMP-J&Q",
        price: 1500,
        status: true,
        stock: 60,
        category: "Saladas",
        thumbnails: ["imagenesEmpanadas/jyq.jpg"]
    },
    {
        id: 4, 
        title: "Empanada de Verdura",
        description: "Mezcla cremosa de acelga con salsa blanca y un toque de nuez moscada.",
        code: "EMP-VERD",
        price: 1500,
        status: true,
        stock: 35,
        category: "Vegetariana",
        thumbnails: ["imagenesEmpanadas/verdura.jpg"]
    },
    {
        id: 5, 
        title: "Empanada de Humita",
        description: "Sabor agridulce con choclo cremoso, cebolla y pimentón.",
        code: "EMP-HUMITA",
        price: 1500,
        status: true,
        stock: 40,
        category: "Vegetariana",
        thumbnails: ["imagenesEmpanadas/humita.jpg"]
    }
];




/////////////////////////PRODUCTOS//////////////////////////////////////////////////////////////////////
//Listar todos los productos
app.get('/api/productos/', (req, res) => {   
    res.json(productos);
});

//Listar producto determinado
app.get('/api/productos/:pid', (req, res) => {
    const productId = req.params.pid;
    const producto = productos.find(p=>p.id===parseInt(productId))
    res.send(producto)
});




//Agregar un nuevo producto
app.post('/api/productos/', (req, res) => {
    const newProductData = req.body;
    
    const requiredFields = ['title', 'description', 'code', 'price', 'stock', 'category'];
    const missingFields = requiredFields.filter(field => newProductData[field] === undefined);

    if (missingFields.length > 0) {
        return res.status(400).json({ 
            error: `Faltan los siguientes campos obligatorios: ${missingFields.join(', ')}`
        });
    }

    const newProduct = {
        id: (productos.length + 1),         
        title: newProductData.title,
        description: newProductData.description,
        code: newProductData.code,
        price: Number(newProductData.price),
        status: newProductData.status !== undefined ? newProductData.status : true, 
        stock: Number(newProductData.stock),
        category: newProductData.category,
        thumbnails: newProductData.thumbnails || [],
    };

    productos.push(newProduct);
    res.status(201).json(newProduct);
});


//Actualizar un producto
app.put('/api/productos/:pid', (req, res) => {
    const productId = parseInt(req.params.pid);
    const updateData = req.body;

    if (updateData.id) {
        delete updateData.id;
    }

    const productIndex = productos.findIndex(p => p.id === productId);

    if (productIndex === -1) {
        return res.status(404).json({ error: "Producto no encontrado para actualizar." });
    }

  
    productos[productIndex] = {
        ...productos[productIndex],
        ...updateData
    };
    
    if (productos[productIndex].price) {
        productos[productIndex].price = Number(productos[productIndex].price);
    }
    if (productos[productIndex].stock) {
        productos[productIndex].stock = Number(productos[productIndex].stock);
    }

    res.json({ 
        message: "Producto actualizado con éxito.", 
        product: productos[productIndex] 
    });
});


//Eliminar el producto
app.delete('/api/productos/:pid', (req, res) => {
    const productId = parseInt(req.params.pid);
    
    const initialLength = productos.length;
    
    productos = productos.filter(p => p.id !== productId);

    if (productos.length === initialLength) {
        return res.status(404).json({ error: "Producto no encontrado para eliminar." });
    }

    res.json({ message: `Producto con ID ${productId} eliminado correctamente.` });
});


////////////////////////////////////////////////////////////////////////////////////////////////////////



/////////////////////CARRITO////////////////////////////////////////////////////////////////////////////
let carritos = []

//Listar todos los carritos
app.post('/api/carts/', (req, res) => {
    let cantidad
    if (carritos == []){
        cantidad = 1
    }
    else{
        cantidad = carritos.length + 1
    }
    const newCart = {
        id: carritos.length + 1, 
        products: [] 
    };
    carritos.push(newCart)
    res.status(201).json(newCart)
})


//Listar productos de un carrito
app.get('/api/carts/:cid', (req, res) => {
    const cartId = parseInt(req.params.cid);
    
    const cart = carritos.find(c => c.id === cartId);

    if (!cart) {
        return res.status(404).json({ error: "Carrito no encontrado." });
    }

    res.json(cart.products);
})


//Agregar producto al carrito
app.post('/api/carts/:cid/product/:pid', (req, res) => {
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
    
    // 4. Devolver la vista actualizada del carrito
    res.json({ 
        message: `Producto ${productId} agregado/actualizado en el carrito ${cartId}.`, 
        cart: cart 
    });
});



app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

