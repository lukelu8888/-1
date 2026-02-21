// Department categories data
// Extracted from Header.tsx for better maintainability

export interface DepartmentSubcategory {
  name: string;
  image?: string;
  items: string[];
}

export interface Department {
  name: string;
  href: string;
  featuredImage?: string;
  subcategories: DepartmentSubcategory[];
}

// This file contains all department and subcategory data
// Data extracted to reduce Header.tsx size and improve maintainability
export const departments: Department[] = [
  { 
    name: 'Appliances', 
    href: '#products',
    featuredImage: 'https://images.unsplash.com/photo-1758488438758-5e2eedf769ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2VzJTIwcmVmcmlnZXJhdG9yfGVufDF8fHx8MTc2MTE3NTQ4OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    subcategories: [
      { 
        name: 'Appliance Parts & Accessories',
        image: 'https://images.unsplash.com/photo-1758488438758-5e2eedf769ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2VzJTIwcmVmcmlnZXJhdG9yfGVufDF8fHx8MTc2MTE3NTQ4OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['Refrigerator Parts', 'Washer Parts', 'Dryer Parts', 'Dishwasher Parts', 'Range Parts', 'Microwave Parts', 'Water Filter', 'Appliance Cleaner']
      },
      { 
        name: 'Appliance Promotions',
        image: 'https://images.unsplash.com/photo-1686023858213-9653d3248fdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwY2FiaW5ldHMlMjBtb2Rlcm58ZW58MXx8fHwxNzYxMTk4ODU5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['Kitchen Packages', 'Laundry Pairs', 'Suite Deals', 'Clearance Items', 'Rebates & Offers']
      },
      { 
        name: 'Cooktops',
        image: 'https://images.unsplash.com/photo-1755168648692-ef8937b7e63e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMHRvb2xzJTIwZHJpbGx8ZW58MXx8fHwxNzYxMTQ1NzAyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['Gas Cooktops', 'Electric Cooktops', 'Induction Cooktops', 'Portable Cooktops']
      },
      { 
        name: 'Dishwashers',
        image: 'https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXNod2FzaGVyJTIwa2l0Y2hlbiUyMGFwcGxpYW5jZXxlbnwxfHx8fDE3NjExNTAxMTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['Built-In Dishwashers', 'Portable Dishwashers', 'Drawer Dishwashers', 'Compact Dishwashers']
      },
      { 
        name: 'Freezers & Ice Makers',
        items: ['Chest Freezers', 'Commercial Freezers & Ice Makers', 'Ice Makers', 'Propane & Solar Freezers', 'Small Space Freezers', 'Upright Freezers']
      },
      { 
        name: 'Garbage Disposals & Accessories',
        items: ['Continuous Feed Disposals', 'Batch Feed Disposals', 'Disposal Accessories']
      },
      { 
        name: 'Heating, Cooling & Air Quality',
        items: ['Air Purifiers', 'Dehumidifiers', 'Humidifiers', 'Portable Heaters', 'Window AC Units']
      },
      { 
        name: 'Kitchen Packages',
        items: ['3-Piece Packages', '4-Piece Packages', 'Complete Kitchen Suites']
      },
      { 
        name: 'Microwaves',
        items: ['Built-In Microwaves', 'Countertop Microwaves', 'Over-the-Range Microwaves']
      },
      { 
        name: 'Ranges',
        items: ['Electric Ranges', 'Gas Ranges', 'Dual Fuel Ranges', 'Slide-In Ranges']
      },
    ]
  },
  { 
    name: 'Bath', 
    href: '#products',
    featuredImage: 'https://images.unsplash.com/photo-1629079447777-1e605162dc8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMHZhbml0eSUyMHNpbmt8ZW58MXx8fHwxNzYxMTk4ODU3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    subcategories: [
      { 
        name: 'Bathtubs & Showers', 
        image: 'https://images.unsplash.com/photo-1682888818704-6dc91e9d7532?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaG93ZXIlMjBiYXRocm9vbXxlbnwxfHx8fDE3NjExOTg4NTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['Alcove Tubs', 'Freestanding Tubs', 'Shower Kits', 'Shower Pans', 'Tub & Shower Combos'] 
      },
      { 
        name: 'Bathroom Vanities', 
        image: 'https://images.unsplash.com/photo-1629079447777-1e605162dc8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMHZhbml0eSUyMHNpbmt8ZW58MXx8fHwxNzYxMTk4ODU3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['Single Sink Vanities', 'Double Sink Vanities', 'Vanity Tops', 'Vessel Sinks', 'Wall-Mounted Vanities'] 
      },
      { 
        name: 'Toilets & Bidets', 
        image: 'https://images.unsplash.com/photo-1730635249891-7fead20f92f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2lsZXQlMjBiYXRocm9vbXxlbnwxfHx8fDE3NjExOTg4NTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['One-Piece Toilets', 'Two-Piece Toilets', 'Smart Toilets', 'Bidets', 'Toilet Seats'] 
      },
      { name: 'Bathroom Sinks', items: ['Undermount Sinks', 'Drop-In Sinks', 'Vessel Sinks', 'Pedestal Sinks', 'Wall-Mounted Sinks'] },
      { 
        name: 'Faucets & Fixtures', 
        image: 'https://images.unsplash.com/photo-1595428774862-a79ab68dbabb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGZhdWNldCUyMG1vZGVybnxlbnwxfHx8fDE3NjExOTg4NTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['Bathroom Faucets', 'Shower Heads', 'Tub Fillers', 'Shower Systems', 'Faucet Parts'] 
      },
      { name: 'Shower Doors & Enclosures', items: ['Sliding Shower Doors', 'Pivot Shower Doors', 'Frameless Doors', 'Shower Enclosures'] },
      { name: 'Bathroom Accessories', items: ['Towel Bars', 'Toilet Paper Holders', 'Robe Hooks', 'Shower Caddies', 'Soap Dispensers'] },
      { name: 'Mirrors & Medicine Cabinets', items: ['Framed Mirrors', 'Frameless Mirrors', 'Lighted Mirrors', 'Medicine Cabinets'] },
      { name: 'Bathroom Lighting', items: ['Vanity Lights', 'Bath Bars', 'Ceiling Lights', 'Exhaust Fan Lights'] },
      { name: 'Bathroom Ventilation', items: ['Exhaust Fans', 'Ventilation Fans with Light', 'Bathroom Heaters'] },
    ]
  },
  { 
    name: 'Building Materials', 
    href: '#products',
    featuredImage: 'https://images.unsplash.com/photo-1586784914382-b48f9a434920?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdW1iZXIlMjB3b29kJTIwbWF0ZXJpYWxzfGVufDF8fHx8MTc2MTE5ODg1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    subcategories: [
      { 
        name: 'Lumber & Composites', 
        image: 'https://images.unsplash.com/photo-1586784914382-b48f9a434920?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdW1iZXIlMjB3b29kJTIwbWF0ZXJpYWxzfGVufDF8fHx8MTc2MTE5ODg1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['Dimensional Lumber', 'Treated Lumber', 'Composite Decking', 'Cedar & Redwood', 'Hardwood Boards'] 
      },
      { 
        name: 'Plywood & Sheathing', 
        image: 'https://images.unsplash.com/photo-1586784914382-b48f9a434920?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdW1iZXIlMjB3b29kJTIwbWF0ZXJpYWxzfGVufDF8fHx8MTc2MTE5ODg1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['Softwood Plywood', 'Hardwood Plywood', 'OSB Sheathing', 'MDF Boards', 'Particleboard'] 
      },
      { 
        name: 'Drywall & Accessories', 
        image: 'https://images.unsplash.com/photo-1589572394490-771aa22db633?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcnl3YWxsJTIwY29uc3RydWN0aW9uJTIwbWF0ZXJpYWx8ZW58MXx8fHwxNzYxMjAwMDMwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['Drywall Panels', 'Joint Compound', 'Drywall Tape', 'Corner Bead', 'Drywall Tools'] 
      },
      { 
        name: 'Insulation', 
        image: 'https://images.unsplash.com/photo-1674485169641-bcb2bf6f1df9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnN1bGF0aW9uJTIwbWF0ZXJpYWwlMjBmb2FtfGVufDF8fHx8MTc2MTIwMDAzMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['Fiberglass Insulation', 'Foam Board', 'Spray Foam', 'Radiant Barrier', 'Insulation Accessories'] 
      },
      { name: 'Roofing Materials', items: ['Asphalt Shingles', 'Metal Roofing', 'Roof Underlayment', 'Roof Vents', 'Flashing'] },
      { name: 'Siding & Trim', items: ['Vinyl Siding', 'Fiber Cement', 'Wood Siding', 'Exterior Trim', 'Soffits & Fascia'] },
      { name: 'Concrete & Cement', items: ['Ready-Mix Concrete', 'Cement Mix', 'Mortar Mix', 'Concrete Blocks', 'Concrete Tools'] },
      { name: 'Metal Building Materials', items: ['Steel Studs', 'Metal Framing', 'Corrugated Metal', 'Metal Trim', 'Fasteners'] },
      { name: 'Gutters & Drainage', items: ['Vinyl Gutters', 'Aluminum Gutters', 'Downspouts', 'Gutter Guards', 'Drainage Pipe'] },
      { name: 'Weatherproofing & Flashing', items: ['House Wrap', 'Flashing Tape', 'Metal Flashing', 'Sealants', 'Waterproof Membrane'] },
    ]
  },
  { 
    name: 'Decor & Furniture', 
    href: '#products',
    featuredImage: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXZpbmclMjByb29tJTIwc29mYXxlbnwxfHx8fDE3NjEyMDAwMDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    subcategories: [
      { 
        name: 'Living Room Furniture', 
        image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXZpbmclMjByb29tJTIwc29mYXxlbnwxfHx8fDE3NjEyMDAwMDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['Sofas', 'Sectionals', 'Loveseats', 'Recliners', 'Coffee Tables', 'TV Stands'] 
      },
      { 
        name: 'Bedroom Furniture', 
        image: 'https://images.unsplash.com/photo-1680503146454-04ac81a63550?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWRyb29tJTIwZnVybml0dXJlJTIwYmVkfGVufDF8fHx8MTc2MTE5MzQzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['Beds', 'Dressers', 'Nightstands', 'Armoires', 'Bedroom Sets'] 
      },
      { 
        name: 'Dining Room Furniture', 
        image: 'https://images.unsplash.com/photo-1547062200-f195b1c77e30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaW5pbmclMjB0YWJsZSUyMGNoYWlyc3xlbnwxfHx8fDE3NjExMjgzMTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['Dining Tables', 'Dining Chairs', 'Bar Stools', 'Buffets', 'China Cabinets'] 
      },
      { name: 'Home Decor', items: ['Wall Art', 'Decorative Pillows', 'Throws', 'Vases', 'Candles'] },
      { 
        name: 'Rugs & Area Carpets', 
        image: 'https://images.unsplash.com/photo-1561578428-5d58d0d965ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmVhJTIwcnVnJTIwY2FycGV0fGVufDF8fHx8MTc2MTIwMDAwMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        items: ['Area Rugs', 'Runner Rugs', 'Outdoor Rugs', 'Rug Pads'] 
      },
      { name: 'Window Treatments', items: ['Curtains', 'Blinds', 'Shades', 'Drapes', 'Valances'] },
      { name: 'Wall Art & Mirrors', items: ['Framed Art', 'Canvas Art', 'Wall Mirrors', 'Wall Decals'] },
      { name: 'Lighting Fixtures', items: ['Chandeliers', 'Pendant Lights', 'Table Lamps', 'Floor Lamps'] },
      { name: 'Decorative Accents', items: ['Decorative Bowls', 'Sculptures', 'Clocks', 'Photo Frames'] },
      { name: 'Seasonal Decor', items: ['Holiday Decor', 'Seasonal Wreaths', 'Outdoor Decorations'] },
    ]
  },
  { 
    name: 'Electrical', 
    href: '#products',
    subcategories: [
      { name: 'Wire & Cable', items: ['Electrical Wire', 'Extension Cords', 'Phone Cable', 'Coaxial Cable'] },
      { name: 'Circuit Breakers & Panels', items: ['Circuit Breakers', 'Load Centers', 'Panel Accessories'] },
      { name: 'Outlets & Switches', items: ['Wall Outlets', 'Light Switches', 'GFCI Outlets', 'USB Outlets'] },
      { name: 'Light Bulbs', items: ['LED Bulbs', 'CFL Bulbs', 'Halogen Bulbs', 'Smart Bulbs'] },
      { name: 'Extension Cords & Power Strips', items: ['Indoor Extension Cords', 'Outdoor Extension Cords', 'Surge Protectors'] },
      { name: 'Generators', items: ['Portable Generators', 'Standby Generators', 'Inverter Generators'] },
      { name: 'Security Systems', items: ['Security Cameras', 'Alarm Systems', 'Motion Sensors'] },
      { name: 'Doorbells & Intercoms', items: ['Video Doorbells', 'Wireless Doorbells', 'Intercom Systems'] },
      { name: 'Home Automation', items: ['Smart Switches', 'Smart Outlets', 'Smart Hubs', 'Voice Control'] },
      { name: 'Electrical Boxes & Covers', items: ['Outlet Boxes', 'Junction Boxes', 'Wall Plates'] },
    ]
  },
  { 
    name: 'Flooring', 
    href: '#products',
    subcategories: [
      { name: 'Hardwood Flooring', items: ['Solid Hardwood', 'Engineered Hardwood', 'Prefinished Hardwood'] },
      { name: 'Laminate Flooring', items: ['AC3 Laminate', 'AC4 Laminate', 'Waterproof Laminate'] },
      { name: 'Vinyl & Resilient Flooring', items: ['Luxury Vinyl Plank', 'Vinyl Sheet', 'Vinyl Tile'] },
      { name: 'Tile Flooring', items: ['Ceramic Tile', 'Porcelain Tile', 'Mosaic Tile', 'Glass Tile'] },
      { name: 'Carpet & Carpet Tile', items: ['Plush Carpet', 'Berber Carpet', 'Carpet Tiles'] },
      { name: 'Natural Stone Flooring', items: ['Marble', 'Granite', 'Travertine', 'Slate'] },
      { name: 'Flooring Underlayment', items: ['Foam Underlayment', 'Cork Underlayment', 'Moisture Barriers'] },
      { name: 'Floor Molding & Trim', items: ['Baseboards', 'Quarter Round', 'T-Molding', 'Reducers'] },
      { name: 'Flooring Tools & Accessories', items: ['Floor Nailers', 'Spacers', 'Trowels', 'Grout Tools'] },
      { name: 'Floor Refinishing Products', items: ['Wood Floor Stain', 'Polyurethane', 'Floor Cleaners'] },
    ]
  },
  { 
    name: 'Hardware', 
    href: '#products',
    subcategories: [
      { name: 'Door Hardware & Locks', items: ['Door Knobs', 'Deadbolts', 'Door Handles', 'Smart Locks'] },
      { name: 'Cabinet Hardware', items: ['Cabinet Pulls', 'Cabinet Knobs', 'Cabinet Hinges'] },
      { name: 'Hinges & Latches', items: ['Door Hinges', 'Gate Hinges', 'Cabinet Hinges', 'Latches'] },
      { name: 'Fasteners & Anchors', items: ['Screws', 'Nails', 'Bolts', 'Wall Anchors'] },
      { name: 'Chain & Rope', items: ['Chains', 'Rope', 'Cable', 'Connectors'] },
      { name: 'Safety & Security', items: ['Padlocks', 'Hasps', 'Security Cables', 'Safes'] },
      { name: 'Gate Hardware', items: ['Gate Latches', 'Gate Hinges', 'Gate Handles'] },
      { name: 'Hooks & Hangers', items: ['Wall Hooks', 'Ceiling Hooks', 'Coat Hooks'] },
      { name: 'Numbers & Letters', items: ['House Numbers', 'Mailbox Letters', 'Address Plaques'] },
      { name: 'Furniture Hardware', items: ['Furniture Legs', 'Casters', 'Furniture Glides'] },
    ]
  },
  { 
    name: 'Heating & Cooling', 
    href: '#products',
    subcategories: [
      { name: 'Furnaces & Heaters', items: ['Gas Furnaces', 'Electric Furnaces', 'Wall Heaters'] },
      { name: 'Air Conditioners', items: ['Central AC', 'Window AC', 'Portable AC', 'Ductless Mini-Split'] },
      { name: 'Thermostats & Controls', items: ['Smart Thermostats', 'Programmable Thermostats', 'Manual Thermostats'] },
      { name: 'Ductwork & Vents', items: ['Duct Pipe', 'Duct Fittings', 'Floor Vents', 'Grilles'] },
      { name: 'Air Purifiers & Humidifiers', items: ['Air Purifiers', 'Humidifiers', 'Dehumidifiers'] },
      { name: 'Ceiling Fans', items: ['Indoor Ceiling Fans', 'Outdoor Ceiling Fans', 'Fan Accessories'] },
      { name: 'Portable Heaters', items: ['Electric Heaters', 'Propane Heaters', 'Infrared Heaters'] },
      { name: 'Fireplaces & Stoves', items: ['Gas Fireplaces', 'Electric Fireplaces', 'Wood Stoves'] },
      { name: 'HVAC Filters', items: ['Furnace Filters', 'AC Filters', 'HEPA Filters'] },
      { name: 'Ventilation Fans', items: ['Bathroom Fans', 'Kitchen Fans', 'Whole House Fans'] },
    ]
  },
  { 
    name: 'Kitchen', 
    href: '#products',
    subcategories: [
      { name: 'Kitchen Cabinets', items: ['Base Cabinets', 'Wall Cabinets', 'Pantry Cabinets', 'Cabinet Doors'] },
      { name: 'Countertops', items: ['Granite Countertops', 'Quartz Countertops', 'Laminate Countertops'] },
      { name: 'Kitchen Sinks', items: ['Undermount Sinks', 'Drop-In Sinks', 'Farmhouse Sinks'] },
      { name: 'Kitchen Faucets', items: ['Pull-Down Faucets', 'Pull-Out Faucets', 'Pot Fillers'] },
      { name: 'Backsplashes', items: ['Tile Backsplash', 'Glass Backsplash', 'Stone Backsplash'] },
      { name: 'Kitchen Islands & Carts', items: ['Kitchen Islands', 'Kitchen Carts', 'Butcher Blocks'] },
      { name: 'Pantry Storage', items: ['Pantry Shelving', 'Pull-Out Organizers', 'Storage Containers'] },
      { name: 'Kitchen Lighting', items: ['Under Cabinet Lights', 'Pendant Lights', 'Recessed Lights'] },
      { name: 'Kitchen Hardware', items: ['Cabinet Pulls', 'Cabinet Knobs', 'Drawer Slides'] },
      { name: 'Kitchen Accessories', items: ['Cutting Boards', 'Knife Blocks', 'Dish Racks'] },
    ]
  },
  { 
    name: 'Lawn & Garden', 
    href: '#products',
    subcategories: [
      { name: 'Lawn Mowers', items: ['Push Mowers', 'Riding Mowers', 'Zero-Turn Mowers', 'Robotic Mowers'] },
      { name: 'Trimmers & Edgers', items: ['String Trimmers', 'Lawn Edgers', 'Hedge Trimmers'] },
      { name: 'Garden Tools', items: ['Shovels', 'Rakes', 'Hoes', 'Pruners', 'Garden Hoses'] },
      { name: 'Pressure Washers', items: ['Electric Pressure Washers', 'Gas Pressure Washers'] },
      { name: 'Outdoor Power Equipment', items: ['Chainsaws', 'Leaf Blowers', 'Snow Blowers'] },
      { name: 'Fertilizers & Chemicals', items: ['Lawn Fertilizer', 'Weed Killer', 'Pest Control'] },
      { name: 'Seeds & Plants', items: ['Grass Seed', 'Flower Seeds', 'Vegetable Seeds', 'Plants'] },
      { name: 'Watering & Irrigation', items: ['Sprinklers', 'Drip Irrigation', 'Watering Timers'] },
      { name: 'Pots & Planters', items: ['Ceramic Pots', 'Plastic Planters', 'Hanging Baskets'] },
      { name: 'Garden Décor', items: ['Garden Statues', 'Wind Chimes', 'Bird Baths', 'Garden Flags'] },
    ]
  },
  { 
    name: 'Lighting & Fans', 
    href: '#products',
    subcategories: [
      { name: 'Ceiling Lights', items: ['Flush Mount', 'Semi-Flush Mount', 'Ceiling Fans with Lights'] },
      { name: 'Chandeliers & Pendants', items: ['Crystal Chandeliers', 'Modern Pendants', 'Island Lights'] },
      { name: 'Wall Sconces', items: ['Indoor Sconces', 'Outdoor Sconces', 'Vanity Lights'] },
      { name: 'Track & Rail Lighting', items: ['Track Lighting Kits', 'Track Heads', 'Monorail Systems'] },
      { name: 'Recessed Lighting', items: ['Recessed Cans', 'Recessed Trims', 'Retrofit Kits'] },
      { name: 'Outdoor Lighting', items: ['Path Lights', 'Spotlights', 'Post Lights', 'String Lights'] },
      { name: 'Ceiling Fans', items: ['Indoor Fans', 'Outdoor Fans', 'Fan Accessories'] },
      { name: 'Light Bulbs', items: ['LED Bulbs', 'CFL Bulbs', 'Smart Bulbs', 'Specialty Bulbs'] },
      { name: 'Lamp Shades', items: ['Drum Shades', 'Empire Shades', 'Bell Shades'] },
      { name: 'Smart Lighting', items: ['Smart Switches', 'Smart Bulbs', 'Lighting Controllers'] },
    ]
  },
  { 
    name: 'Outdoor Living', 
    href: '#products',
    subcategories: [
      { name: 'Patio Furniture', items: ['Patio Sets', 'Lounge Chairs', 'Outdoor Sofas', 'Adirondack Chairs'] },
      { name: 'Grills & Outdoor Cooking', items: ['Gas Grills', 'Charcoal Grills', 'Pellet Grills', 'Smokers'] },
      { name: 'Outdoor Heating', items: ['Patio Heaters', 'Fire Tables', 'Chimineas'] },
      { name: 'Gazebos & Pergolas', items: ['Gazebos', 'Pergolas', 'Pavilions', 'Canopies'] },
      { name: 'Patio Umbrellas', items: ['Market Umbrellas', 'Cantilever Umbrellas', 'Umbrella Bases'] },
      { name: 'Outdoor Cushions', items: ['Chair Cushions', 'Bench Cushions', 'Pillow Sets'] },
      { name: 'Fire Pits & Fireplaces', items: ['Wood Fire Pits', 'Gas Fire Pits', 'Outdoor Fireplaces'] },
      { name: 'Outdoor Storage', items: ['Deck Boxes', 'Sheds', 'Storage Benches'] },
      { name: 'Playsets & Trampolines', items: ['Swing Sets', 'Trampolines', 'Playhouses'] },
      { name: 'Outdoor Décor', items: ['Garden Statues', 'Fountains', 'Planters', 'Wind Chimes'] },
    ]
  },
  { 
    name: 'Paint', 
    href: '#products',
    subcategories: [
      { name: 'Interior Paint', items: ['Wall Paint', 'Ceiling Paint', 'Trim Paint', 'Cabinet Paint'] },
      { name: 'Exterior Paint', items: ['House Paint', 'Deck Paint', 'Fence Paint', 'Masonry Paint'] },
      { name: 'Primers & Sealers', items: ['Interior Primer', 'Exterior Primer', 'Sealers', 'Bonding Primer'] },
      { name: 'Spray Paint', items: ['Spray Paint Cans', 'Primer Spray', 'Specialty Spray'] },
      { name: 'Stains & Finishes', items: ['Wood Stain', 'Deck Stain', 'Polyurethane', 'Varnish'] },
      { name: 'Paint Brushes & Rollers', items: ['Paint Brushes', 'Paint Rollers', 'Roller Covers'] },
      { name: 'Paint Trays & Supplies', items: ['Paint Trays', 'Liners', 'Pour Spouts'] },
      { name: 'Painter\'s Tape', items: ['Blue Tape', 'Green Tape', 'Masking Tape'] },
      { name: 'Paint Strippers & Removers', items: ['Paint Stripper', 'Graffiti Remover', 'Adhesive Remover'] },
      { name: 'Color Samples', items: ['Paint Chips', 'Sample Pots', 'Color Cards'] },
    ]
  },
  { 
    name: 'Plumbing', 
    href: '#products',
    subcategories: [
      { name: 'Pipes & Fittings', items: ['PVC Pipe', 'Copper Pipe', 'PEX Pipe', 'Pipe Fittings'] },
      { name: 'Faucets & Fixtures', items: ['Kitchen Faucets', 'Bathroom Faucets', 'Shower Heads'] },
      { name: 'Toilets & Toilet Parts', items: ['Toilets', 'Toilet Seats', 'Flappers', 'Fill Valves'] },
      { name: 'Sinks & Drains', items: ['Kitchen Sinks', 'Bathroom Sinks', 'Drain Parts'] },
      { name: 'Water Heaters', items: ['Tank Water Heaters', 'Tankless Water Heaters', 'Heat Pump'] },
      { name: 'Pumps & Tanks', items: ['Sump Pumps', 'Well Pumps', 'Pressure Tanks'] },
      { name: 'Valves & Manifolds', items: ['Shut-Off Valves', 'Ball Valves', 'PEX Manifolds'] },
      { name: 'Plumbing Tools', items: ['Pipe Wrenches', 'Pipe Cutters', 'Augers', 'Plungers'] },
      { name: 'Water Filtration', items: ['Water Filters', 'Softeners', 'Under Sink Filters'] },
      { name: 'Plumbing Repair & Maintenance', items: ['Sealants', 'Tape', 'Plumbers Putty'] },
    ]
  },
  { 
    name: 'Storage & Organization', 
    href: '#products',
    subcategories: [
      { name: 'Shelving Units', items: ['Wire Shelving', 'Wood Shelving', 'Metal Shelving'] },
      { name: 'Storage Cabinets', items: ['Garage Cabinets', 'Utility Cabinets', 'Lockers'] },
      { name: 'Closet Organizers', items: ['Closet Systems', 'Closet Rods', 'Shoe Racks'] },
      { name: 'Garage Storage', items: ['Overhead Storage', 'Wall Systems', 'Bike Racks'] },
      { name: 'Bins & Containers', items: ['Storage Bins', 'Storage Totes', 'Drawer Organizers'] },
      { name: 'Wall-Mounted Storage', items: ['Wall Hooks', 'Pegboards', 'Wall Shelves'] },
      { name: 'Hooks & Racks', items: ['Coat Hooks', 'Utility Hooks', 'Storage Racks'] },
      { name: 'Tool Storage', items: ['Tool Chests', 'Tool Boxes', 'Tool Cabinets'] },
      { name: 'Wire Shelving', items: ['Wire Shelf Units', 'Wire Baskets', 'Wire Accessories'] },
      { name: 'Laundry Storage', items: ['Laundry Baskets', 'Hampers', 'Ironing Boards'] },
    ]
  },
  { 
    name: 'Tools', 
    href: '#products',
    subcategories: [
      { name: 'Power Drills', items: ['Cordless Drills', 'Hammer Drills', 'Impact Drivers'] },
      { name: 'Saws & Blades', items: ['Circular Saws', 'Miter Saws', 'Table Saws', 'Saw Blades'] },
      { name: 'Sanders & Grinders', items: ['Orbital Sanders', 'Belt Sanders', 'Angle Grinders'] },
      { name: 'Hammers & Nail Guns', items: ['Hammers', 'Nail Guns', 'Brad Nailers', 'Staplers'] },
      { name: 'Wrenches & Sockets', items: ['Wrench Sets', 'Socket Sets', 'Ratchets'] },
      { name: 'Measuring & Layout Tools', items: ['Tape Measures', 'Levels', 'Laser Levels', 'Squares'] },
      { name: 'Hand Tools', items: ['Screwdrivers', 'Pliers', 'Utility Knives', 'Chisels'] },
      { name: 'Tool Sets', items: ['Hand Tool Sets', 'Power Tool Combos', 'Mechanics Sets'] },
      { name: 'Ladders & Scaffolding', items: ['Step Ladders', 'Extension Ladders', 'Scaffolding'] },
      { name: 'Tool Storage', items: ['Tool Bags', 'Tool Belts', 'Tool Boxes'] },
    ]
  },
  { 
    name: 'Windows & Doors', 
    href: '#products',
    subcategories: [
      { name: 'Exterior Doors', items: ['Entry Doors', 'French Doors', 'Sliding Doors', 'Storm Doors'] },
      { name: 'Interior Doors', items: ['Panel Doors', 'Barn Doors', 'Bifold Doors', 'French Doors'] },
      { name: 'Windows', items: ['Double Hung Windows', 'Casement Windows', 'Sliding Windows'] },
      { name: 'Storm Doors', items: ['Full View Storm Doors', 'Retractable Screen Doors'] },
      { name: 'Garage Doors', items: ['Sectional Doors', 'Garage Door Openers', 'Garage Door Parts'] },
      { name: 'Door Hardware', items: ['Door Knobs', 'Door Handles', 'Deadbolts', 'Hinges'] },
      { name: 'Window Hardware', items: ['Window Locks', 'Window Handles', 'Window Screens'] },
      { name: 'Door Frames & Jambs', items: ['Door Frames', 'Door Jambs', 'Door Trim'] },
      { name: 'Window Treatments', items: ['Blinds', 'Shades', 'Curtains', 'Shutters'] },
      { name: 'Weather Stripping', items: ['Door Sweeps', 'Weather Strip', 'Door Seals'] },
    ]
  },
];
