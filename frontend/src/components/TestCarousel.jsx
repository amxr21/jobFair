import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Carousel } from 'primereact/carousel';
import { Tag } from 'primereact/tag';

export default function GeneralCarousel() {
    const [products] = useState([
        {
            id: 1,
            name: "Bluetooth Speaker",
            price: 49.99,
            inventoryStatus: "INSTOCK"
        },
        {
            id: 2,
            name: "Smart Watch",
            price: 99.99,
            inventoryStatus: "LOWSTOCK"
        },
        {
            id: 3,
            name: "Wireless Headphones",
            price: 79.99,
            inventoryStatus: "OUTOFSTOCK"
        },
        {
            id: 4,
            name: "USB-C Charger",
            price: 19.99,
            inventoryStatus: "INSTOCK"
        },
        {
            id: 5,
            name: "Gaming Mouse",
            price: 59.99,
            inventoryStatus: "LOWSTOCK"
        },
    ]);

    const getSeverity = (product) => {
        switch (product.inventoryStatus) {
            case 'INSTOCK':
                return 'success';
            case 'LOWSTOCK':
                return 'warning';
            case 'OUTOFSTOCK':
                return 'danger';
            default:
                return null;
        }
    };

    const productTemplate = (product) => {
        return (
            <div className="border-1 surface-border border-round m-2 text-center py-5 px-3 bg-red-200">
                <div className="mb-3">
                    {/* ✅ Replaced image with a gray box placeholder */}
                    <div className="w-6 h-6 bg-gray-300 flex items-center justify-center text-sm text-gray-600 border-round">
                        Image
                    </div>
                </div>
                <div>
                    <h4 className="mb-1">{product.name}</h4>
                    <h6 className="mt-0 mb-3">${product.price}</h6>
                    <Tag value={product.inventoryStatus} severity={getSeverity(product)} />
                    {/* ✅ Added padding to buttons */}
                    <div className="mt-5 flex flex-wrap gap-2 justify-content-center">
                        <Button icon="pi pi-search" rounded className="p-2" />
                        <Button icon="pi pi-star-fill" rounded severity="success" className="p-2" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="card">
            <Carousel
                value={products}
                numVisible={3}
                numScroll={1}
                // responsiveOptions={responsiveOptions}
                itemTemplate={productTemplate}
                className='bg-red-500 gap-5'
            />
        </div>
    );
}
