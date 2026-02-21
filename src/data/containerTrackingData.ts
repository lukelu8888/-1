export interface TrackingEvent {
  date: string;
  time: string;
  status: string;
  location: string;
  description: string;
  completed: boolean;
}

export interface ContainerInfo {
  containerNumber: string;
  bookingNumber: string;
  billOfLading: string;
  vessel: string;
  voyage: string;
  carrier: string;
  containerType: string;
  containerSize: string;
  origin: string;
  destination: string;
  estimatedDeparture: string;
  estimatedArrival: string;
  actualDeparture?: string;
  actualArrival?: string;
  currentStatus: 'In Transit' | 'At Port' | 'Customs Clearance' | 'Out for Delivery' | 'Delivered';
  events: TrackingEvent[];
}

// Mock container tracking data
export const containerTrackingDatabase: { [key: string]: ContainerInfo } = {
  'CSNU1234567': {
    containerNumber: 'CSNU1234567',
    bookingNumber: 'BK-2024-001',
    billOfLading: 'BL-SH-2024-001',
    vessel: 'COSCO SHIPPING GALAXY',
    voyage: 'V024E',
    carrier: 'COSCO SHIPPING',
    containerType: '40HC',
    containerSize: '40ft High Cube',
    origin: 'Shanghai, China',
    destination: 'Los Angeles, USA',
    estimatedDeparture: '2024-11-01',
    estimatedArrival: '2024-11-20',
    actualDeparture: '2024-11-01',
    currentStatus: 'In Transit',
    events: [
      {
        date: '2024-11-10',
        time: '14:30',
        status: 'At Sea',
        location: 'Pacific Ocean',
        description: 'Container in transit across Pacific',
        completed: true,
      },
      {
        date: '2024-11-05',
        time: '08:45',
        status: 'Vessel Departed',
        location: 'Yokohama, Japan',
        description: 'Vessel departed from port',
        completed: true,
      },
      {
        date: '2024-11-04',
        time: '15:20',
        status: 'Transshipment',
        location: 'Yokohama, Japan',
        description: 'Container transferred to connecting vessel',
        completed: true,
      },
      {
        date: '2024-11-01',
        time: '10:15',
        status: 'Vessel Departed',
        location: 'Shanghai, China',
        description: 'Vessel departed from origin port',
        completed: true,
      },
      {
        date: '2024-10-31',
        time: '16:30',
        status: 'Loaded on Vessel',
        location: 'Shanghai Port, China',
        description: 'Container loaded onto vessel COSCO SHIPPING GALAXY',
        completed: true,
      },
      {
        date: '2024-10-30',
        time: '09:00',
        status: 'Gate In',
        location: 'Shanghai Port, China',
        description: 'Container received at port',
        completed: true,
      },
      {
        date: '2024-10-28',
        time: '14:00',
        status: 'Picked Up',
        location: 'Fujian Cosun Factory',
        description: 'Container picked up from shipper',
        completed: true,
      },
      {
        date: '2024-11-20',
        time: '--:--',
        status: 'Estimated Arrival',
        location: 'Los Angeles, USA',
        description: 'Expected arrival at destination port',
        completed: false,
      },
    ],
  },
  'MSCU9876543': {
    containerNumber: 'MSCU9876543',
    bookingNumber: 'BK-2024-002',
    billOfLading: 'BL-SH-2024-002',
    vessel: 'MSC MAYA',
    voyage: 'V103W',
    carrier: 'MSC',
    containerType: '20GP',
    containerSize: '20ft Standard',
    origin: 'Xiamen, China',
    destination: 'Hamburg, Germany',
    estimatedDeparture: '2024-10-15',
    estimatedArrival: '2024-11-25',
    actualDeparture: '2024-10-15',
    actualArrival: '2024-11-23',
    currentStatus: 'Customs Clearance',
    events: [
      {
        date: '2024-11-24',
        time: '09:00',
        status: 'Customs Clearance',
        location: 'Hamburg, Germany',
        description: 'Container under customs inspection',
        completed: true,
      },
      {
        date: '2024-11-23',
        time: '06:30',
        status: 'Discharged',
        location: 'Hamburg Port, Germany',
        description: 'Container discharged from vessel',
        completed: true,
      },
      {
        date: '2024-11-23',
        time: '04:15',
        status: 'Vessel Arrived',
        location: 'Hamburg, Germany',
        description: 'Vessel arrived at destination port',
        completed: true,
      },
      {
        date: '2024-11-10',
        time: '11:20',
        status: 'Transshipment',
        location: 'Rotterdam, Netherlands',
        description: 'Container transferred to connecting vessel',
        completed: true,
      },
      {
        date: '2024-10-15',
        time: '13:45',
        status: 'Vessel Departed',
        location: 'Xiamen, China',
        description: 'Vessel departed from origin port',
        completed: true,
      },
      {
        date: '2024-10-14',
        time: '10:30',
        status: 'Loaded on Vessel',
        location: 'Xiamen Port, China',
        description: 'Container loaded onto vessel MSC MAYA',
        completed: true,
      },
      {
        date: '2024-10-13',
        time: '08:00',
        status: 'Gate In',
        location: 'Xiamen Port, China',
        description: 'Container received at port',
        completed: true,
      },
      {
        date: '2024-11-26',
        time: '--:--',
        status: 'Ready for Pickup',
        location: 'Hamburg, Germany',
        description: 'Expected to be ready for pickup',
        completed: false,
      },
    ],
  },
  'HLCU5555888': {
    containerNumber: 'HLCU5555888',
    bookingNumber: 'BK-2024-003',
    billOfLading: 'BL-SH-2024-003',
    vessel: 'HAPAG-LLOYD EXPRESS',
    voyage: 'V087S',
    carrier: 'Hapag-Lloyd',
    containerType: '40GP',
    containerSize: '40ft Standard',
    origin: 'Shenzhen, China',
    destination: 'Santos, Brazil',
    estimatedDeparture: '2024-10-20',
    estimatedArrival: '2024-11-28',
    actualDeparture: '2024-10-20',
    currentStatus: 'At Port',
    events: [
      {
        date: '2024-11-27',
        time: '07:00',
        status: 'Discharged',
        location: 'Santos Port, Brazil',
        description: 'Container discharged from vessel',
        completed: true,
      },
      {
        date: '2024-11-26',
        time: '18:30',
        status: 'Vessel Arrived',
        location: 'Santos, Brazil',
        description: 'Vessel arrived at destination port',
        completed: true,
      },
      {
        date: '2024-11-15',
        time: '14:20',
        status: 'At Sea',
        location: 'Atlantic Ocean',
        description: 'Container in transit across Atlantic',
        completed: true,
      },
      {
        date: '2024-10-20',
        time: '09:30',
        status: 'Vessel Departed',
        location: 'Shenzhen, China',
        description: 'Vessel departed from origin port',
        completed: true,
      },
      {
        date: '2024-10-19',
        time: '15:00',
        status: 'Loaded on Vessel',
        location: 'Shenzhen Port, China',
        description: 'Container loaded onto vessel HAPAG-LLOYD EXPRESS',
        completed: true,
      },
      {
        date: '2024-10-18',
        time: '11:00',
        status: 'Gate In',
        location: 'Shenzhen Port, China',
        description: 'Container received at port',
        completed: true,
      },
      {
        date: '2024-11-28',
        time: '--:--',
        status: 'Customs Clearance',
        location: 'Santos, Brazil',
        description: 'Pending customs clearance',
        completed: false,
      },
      {
        date: '2024-11-30',
        time: '--:--',
        status: 'Ready for Pickup',
        location: 'Santos, Brazil',
        description: 'Expected to be ready for pickup',
        completed: false,
      },
    ],
  },
};

// Function to search container by number
export function searchContainer(containerNumber: string): ContainerInfo | null {
  const cleanNumber = containerNumber.toUpperCase().trim();
  return containerTrackingDatabase[cleanNumber] || null;
}

// Sample container numbers for demo
export const sampleContainerNumbers = [
  'CSNU1234567',
  'MSCU9876543',
  'HLCU5555888',
];
