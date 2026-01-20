'use client';

import { useReducer, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Flight {
  id: string;
  price: number;
  airline: string;
  departureTime: string;
  arrivalTime: string;
}

interface Hotel {
  id: string;
  name: string;
  price: number;
  rating: number;
}

type BookingState = {
  inputs: {
    destination: string;
    startDate: string;
    endDate: string;
  };
  status: 'idle' | 'searchingFlights' | 'searchingHotels' | 'error';

  flights: Flight[];
  hotels: Hotel[];

  selectedFlightId: string | null;
  selectedHotelId: string | null;

  error: string | null;
};

type Action =
  | { type: 'inputUpdated'; inputs: Partial<BookingState['inputs']> }
  | { type: 'flightsLoaded'; flights: Flight[] }
  | { type: 'flightSelected'; flightId: string }
  | { type: 'hotelsLoaded'; hotels: Hotel[] }
  | { type: 'hotelSelected'; hotelId: string }
  | { type: 'error'; error: string };

const initialState: BookingState = {
  inputs: {
    destination: '',
    startDate: '',
    endDate: '',
  },
  status: 'idle',
  flights: [],
  hotels: [],
  selectedFlightId: null,
  selectedHotelId: null,
  error: null,
};

function tripSearchReducer(state: BookingState, action: Action): BookingState {
  switch (action.type) {
    case 'inputUpdated':
      const inputs = {
        ...state.inputs,
        ...action.inputs,
      };
      return {
        ...state,
        inputs,
        status:
          inputs.destination && inputs.startDate && inputs.endDate
            ? 'searchingFlights'
            : state.status,
      };
    
    case 'flightsLoaded':
      const cheapestFlight = action.flights.reduce((prev, current) =>
        prev.price < current.price ? prev : current
      );
      
      return {
        ...state,
        status: 'searchingHotels',
        flights: action.flights,
        selectedFlightId: cheapestFlight.id,
      };
    
    case 'flightSelected':
      return {
        ...state,
        selectedFlightId: action.flightId,
      };
    
    case 'hotelsLoaded':
      const bestHotel = action.hotels.reduce((prev, current) =>
        prev.rating > current.rating ? prev : current
      );
      
      return {
        ...state,
        status: 'idle',
        hotels: action.hotels,
        selectedHotelId: bestHotel.id,
      };
    
    case 'hotelSelected':
      return {
        ...state,
        selectedHotelId: action.hotelId,
      };
    
    case 'error':
      return {
        ...state,
        status: 'error',
        error: action.error,
      };
    
    default:
      return state;
  }
}

export default function TripSearch() {
  const [state, dispatch] = useReducer(tripSearchReducer, initialState);

  useEffect(() => {
    const { destination, startDate, endDate } = state.inputs;
    const { status } = state;

    // Only proceed if we have all required inputs
    if (!destination || !startDate || !endDate) return;

    // Handle flight search
    if (status === 'searchingFlights') {
      const searchFlights = async () => {
        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Mock flight data
          const flights: Flight[] = [
            {
              id: '1',
              price: 299,
              airline: 'Mock Airlines',
              departureTime: '10:00 AM',
              arrivalTime: '2:00 PM',
            },
            {
              id: '2',
              price: 399,
              airline: 'Demo Airways',
              departureTime: '2:00 PM',
              arrivalTime: '6:00 PM',
            },
          ];

          // Pick the cheapest flight
          const bestFlight = flights.reduce((prev, current) =>
            prev.price < current.price ? prev : current
          );

          dispatch({ type: 'flightsLoaded', flights: flights });
        } catch {
          dispatch({ type: 'error', error: 'Failed to search flights' });
        }
      };

      searchFlights();
    }

    // Handle hotel search
    if (status === 'searchingHotels') {
      const searchHotels = async () => {
        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Mock hotel data
          const hotels: Hotel[] = [
            {
              id: '1',
              name: 'Grand Hotel',
              price: 150,
              rating: 4.5,
            },
            {
              id: '2',
              name: 'Budget Inn',
              price: 80,
              rating: 3.8,
            },
          ];

          // Pick the best rated hotel
          const bestHotel = hotels.reduce((prev, current) =>
            prev.rating > current.rating ? prev : current
          );

          dispatch({ type: 'hotelsLoaded', hotels: hotels });
        } catch {
          dispatch({ type: 'error', error: 'Failed to search hotels' });
        }
      };

      searchHotels();
    }
  }, [state]);

  const selectedFlight = state.flights.find((flight) => flight.id === state.selectedFlightId);
  const selectedHotel = state.hotels.find((hotel) => hotel.id === state.selectedHotelId);

  return (
    <div className="p-8 w-full max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Search Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              onBlur={(e) =>
                dispatch({
                  type: 'inputUpdated',
                  inputs: {
                    destination: e.target.value.trim(),
                  },
                })
              }
              placeholder="Enter destination"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={state.inputs.startDate}
              onChange={(e) =>
                dispatch({
                  type: 'inputUpdated',
                  inputs: {
                    startDate: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={state.inputs.endDate}
              onChange={(e) =>
                dispatch({
                  type: 'inputUpdated',
                  inputs: {
                    endDate: e.target.value,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {state.error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          {state.error}
        </div>
      )}

      <div className="space-y-6">
        <Card
          className={state.status === 'searchingFlights' ? 'opacity-50' : ''}
        >
          <CardHeader>
            <CardTitle>Flight Search</CardTitle>
          </CardHeader>
          <CardContent>
            {state.status === 'searchingFlights' ? (
              <p>Searching for flights...</p>
            ) : selectedFlight ? (
              <div className="space-y-2">
                <p className="font-medium">Selected Flight:</p>
                <p>Airline: {selectedFlight.airline}</p>
                <p>Price: ${selectedFlight.price}</p>
                <p>Departure: {selectedFlight.departureTime}</p>
                <p>Arrival: {selectedFlight.arrivalTime}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card
          className={
            state.status === 'searchingHotels' ||
              state.status === 'searchingFlights'
              ? 'opacity-50'
              : ''
          }
        >
          <CardHeader>
            <CardTitle>Hotel Search</CardTitle>
          </CardHeader>
          <CardContent>
            {state.status === 'searchingHotels' ? (
              <p>Searching for hotels...</p>
            ) : selectedHotel ? (
              <div className="space-y-2">
                <p className="font-medium">Selected Hotel:</p>
                <p>Name: {selectedHotel.name}</p>
                <p>Price: ${selectedHotel.price}/night</p>
                <p>Rating: {selectedHotel.rating}/5</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
