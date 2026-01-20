'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { createContext, use, useReducer, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchHotels } from './fetchHotels';
import { fetchFlights } from './fetchFlights';

// Types
enum Step {
  FLIGHT_SEARCH = 'FLIGHT_SEARCH',
  FLIGHT_RESULTS = 'FLIGHT_RESULTS',
  HOTEL_SEARCH = 'HOTEL_SEARCH',
  HOTEL_RESULTS = 'HOTEL_RESULTS',
  REVIEW = 'REVIEW',
  CONFIRMATION = 'CONFIRMATION',
}

export interface FlightOption {
  id: string;
  airline: string;
  price: number;
  duration: string;
}

export interface HotelOption {
  id: string;
  name: string;
  price: number;
  rating: number;
  amenities: string[];
}
export interface FlightSearch {
  destination: string;
  departure: string;
  arrival: string;
  passengers: number;
  isOneWay: boolean;
}

export interface HotelSearch {
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType: string;
}

interface BookingState {
  currentStep: Step;
  flightSearch: FlightSearch;
  selectedFlight: FlightOption | null;
  hotelSearch: HotelSearch;
  selectedHotel: HotelOption | null;
}

type BookingAction =
  | {
    type: 'flightSearchUpdated';
    payload: Partial<BookingState['flightSearch']>;
  }
  | {
    type: 'flightSearchSubmitted';
  }
  | { type: 'flightSelected'; flight: FlightOption | null }
  | {
    type: 'hotelSearchUpdated';
    payload: Partial<BookingState['hotelSearch']>;
  }
  | {
    type: 'hotelSearchSubmitted';
  }
  | { type: 'hotelSelected'; payload: HotelOption | null }
  | { type: 'RESET_HOTEL' }
  | { type: 'back' }
  | { type: 'changeFlight' }
  | { type: 'changeHotel' }
  | { type: 'bookingConfirmed' };

// Context
const BookingContext = createContext<{
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
} | null>(null);

// Reducer
function bookingReducer(
  state: BookingState,
  action: BookingAction
): BookingState {
  switch (action.type) {
    case 'flightSearchUpdated':
      return {
        ...state,
        flightSearch: { ...state.flightSearch, ...action.payload },
      };
    case 'flightSearchSubmitted':
      return {
        ...state,
        // set hotel dates to same as flight dates
        hotelSearch: {
          ...state.hotelSearch,
          checkIn: state.flightSearch.departure,
          checkOut: state.flightSearch.arrival,
        },
        currentStep: Step.FLIGHT_RESULTS,
      };
    case 'flightSelected':
      return {
        ...state,
        selectedFlight: action.flight,
        currentStep: Step.HOTEL_SEARCH,
      };
    case 'hotelSearchUpdated':
      return {
        ...state,
        hotelSearch: { ...state.hotelSearch, ...action.payload },
      };
    case 'hotelSearchSubmitted':
      return {
        ...state,
        currentStep: Step.HOTEL_RESULTS,
      };
    case 'hotelSelected':
      return {
        ...state,
        selectedHotel: action.payload,
        currentStep: Step.REVIEW,
      };
    case 'back':
      switch (state.currentStep) {
        case Step.FLIGHT_RESULTS:
          return {
            ...state,
            currentStep: Step.FLIGHT_SEARCH,
          };
        case Step.HOTEL_RESULTS:
          return {
            ...state,
            currentStep: Step.HOTEL_SEARCH,
          };
        case Step.REVIEW:
          return {
            ...state,
            currentStep: Step.HOTEL_RESULTS,
          };
        default:
          return state;
      }
    case 'changeFlight':
      return {
        ...state,
        currentStep: Step.FLIGHT_SEARCH,
      };
    case 'changeHotel':
      return {
        ...state,
        currentStep: Step.HOTEL_SEARCH,
      };
    case 'bookingConfirmed':
      return {
        ...state,
        currentStep: Step.CONFIRMATION,
      };

    default:
      return state;
  }
}

// Components
function FlightBookingForm() {
  const { state, dispatch } = use(BookingContext)!;
  const { flightSearch } = state;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'flightSearchSubmitted' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Switch
          id="one-way"
          checked={flightSearch.isOneWay}
          onCheckedChange={(checked) =>
            dispatch({
              type: 'flightSearchUpdated',
              payload: { isOneWay: checked },
            })
          }
        />
        <Label htmlFor="one-way">One-way flight</Label>
      </div>

      <div>
        <Label htmlFor="destination">Destination</Label>
        <Input
          type="text"
          id="destination"
          value={flightSearch.destination}
          onChange={(e) =>
            dispatch({
              type: 'flightSearchUpdated',
              payload: { destination: e.target.value },
            })
          }
          required
        />
      </div>

      <div>
        <Label htmlFor="departure">Departure Date</Label>
        <Input
          type="date"
          id="departure"
          value={flightSearch.departure}
          onChange={(e) =>
            dispatch({
              type: 'flightSearchUpdated',
              payload: { departure: e.target.value },
            })
          }
          required
        />
      </div>

      {!flightSearch.isOneWay && (
        <div>
          <Label htmlFor="arrival">Return Date</Label>
          <Input
            type="date"
            id="arrival"
            value={flightSearch.arrival}
            onChange={(e) =>
              dispatch({
                type: 'flightSearchUpdated',
                payload: { arrival: e.target.value },
              })
            }
            required
          />
        </div>
      )}

      <div>
        <Label htmlFor="passengers">Number of Passengers</Label>
        <Input
          type="number"
          id="passengers"
          value={flightSearch.passengers}
          onChange={(e) =>
            dispatch({
              type: 'flightSearchUpdated',
              payload: { passengers: parseInt(e.target.value) },
            })
          }
          min="1"
          max="9"
          required
        />
      </div>

      <Button type="submit" className="w-full">
        Search Flights
      </Button>
    </form>
  );
}

function FlightSearchResults() {
  const { state, dispatch } = use(BookingContext)!;
  const { selectedFlight, flightSearch } = state;

  const { data: flights, isLoading, error } = useQuery({
    queryKey: ['flights', flightSearch],
    queryFn: () => fetchFlights(flightSearch),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const handleSelectFlight = (flight: FlightOption) => {
    dispatch({ type: 'flightSelected', flight: flight });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-gray-500">Loading flights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Available Flights</h2>
        <Button variant="outline" onClick={() => dispatch({ type: 'back' })}>
          Back to Search
        </Button>
      </div>

      <div className="space-y-4">
        {flights?.map((flight) => (
          <div
            key={flight.id}
            className={`p-4 border rounded hover:shadow-md ${selectedFlight?.id === flight.id
                ? 'border-blue-500 bg-blue-50'
                : ''
              }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{flight.airline}</h3>
                <p className="text-gray-600">Duration: {flight.duration}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">${flight.price}</p>
                <Button
                  className="mt-2"
                  onClick={() => handleSelectFlight(flight)}
                >
                  Select
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HotelBookingForm() {
  const { state, dispatch } = use(BookingContext)!;
  const { hotelSearch } = state;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'hotelSearchSubmitted' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold">Hotel Booking</h2>
      <div>
        <Label htmlFor="checkIn">Check-in Date</Label>
        <Input
          type="date"
          id="checkIn"
          value={hotelSearch.checkIn}
          onChange={(e) =>
            dispatch({
              type: 'hotelSearchUpdated',
              payload: { checkIn: e.target.value },
            })
          }
          required
        />
      </div>

      <div>
        <Label htmlFor="checkOut">Check-out Date</Label>
        <Input
          type="date"
          id="checkOut"
          value={hotelSearch.checkOut}
          onChange={(e) =>
            dispatch({
              type: 'hotelSearchUpdated',
              payload: { checkOut: e.target.value },
            })
          }
          required
        />
      </div>

      <div>
        <Label htmlFor="guests">Number of Guests</Label>
        <Input
          type="number"
          id="guests"
          value={hotelSearch.guests}
          onChange={(e) =>
            dispatch({
              type: 'hotelSearchUpdated',
              payload: { guests: parseInt(e.target.value) },
            })
          }
          min="1"
          max="4"
          required
        />
      </div>

      <div>
        <Label htmlFor="roomType">Room Type</Label>
        <select
          id="roomType"
          value={hotelSearch.roomType}
          onChange={(e) =>
            dispatch({
              type: 'hotelSearchUpdated',
              payload: { roomType: e.target.value },
            })
          }
          className="w-full p-2 border rounded"
          required
        >
          <option value="standard">Standard</option>
          <option value="deluxe">Deluxe</option>
          <option value="suite">Suite</option>
        </select>
      </div>

      <Button type="submit" className="w-full">
        Search Hotels
      </Button>
    </form>
  );
}

function HotelSearchResults() {
  const { state, dispatch } = use(BookingContext)!;
  const { selectedHotel, hotelSearch } = state;

  const { data: hotels, isLoading, error } = useQuery({
    queryKey: ['hotels', hotelSearch],
    queryFn: () => fetchHotels(hotelSearch),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const handleSelectHotel = (hotel: HotelOption) => {
    dispatch({ type: 'hotelSelected', payload: hotel });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-gray-500">Loading hotels...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Available Hotels</h2>
        <Button variant="outline" onClick={() => dispatch({ type: 'back' })}>
          Back to Search
        </Button>
      </div>

      <div className="space-y-4">
        {hotels?.map((hotel) => (
          <div
            key={hotel.id}
            className={`p-4 border rounded hover:shadow-md ${selectedHotel?.id === hotel.id ? 'border-blue-500 bg-blue-50' : ''
              }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{hotel.name}</h3>
                <p className="text-gray-600">Rating: {hotel.rating}/5</p>
                <p className="text-sm text-gray-500">
                  {hotel.amenities.join(', ')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">${hotel.price}/night</p>
                <Button
                  className="mt-2"
                  onClick={() => handleSelectHotel(hotel)}
                >
                  Select
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingReview() {
  const { state, dispatch } = use(BookingContext)!;
  const { selectedFlight, selectedHotel, flightSearch, hotelSearch } = state;

  const handleConfirm = () => {
    dispatch({ type: 'bookingConfirmed' });
  };

  const handleBack = () => {
    dispatch({ type: 'back' });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Review Your Booking</h2>

      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h3 className="font-bold mb-2">Flight Details</h3>
          <p>Airline: {selectedFlight?.airline}</p>
          <p>Duration: {selectedFlight?.duration}</p>
          <p>Price: ${selectedFlight?.price}</p>
          <p>Passengers: {flightSearch.passengers}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => {
              dispatch({ type: 'changeFlight' });
            }}
          >
            Change Flight
          </Button>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-bold mb-2">Hotel Details</h3>
          <p>Hotel: {selectedHotel?.name}</p>
          <p>Rating: {selectedHotel?.rating}/5</p>
          <p>Price: ${selectedHotel?.price}/night</p>
          <p>Room Type: {hotelSearch.roomType}</p>
          <p>Guests: {hotelSearch.guests}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => dispatch({ type: 'changeHotel' })}
          >
            Change Hotel
          </Button>
        </div>

        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-bold mb-2">Total Cost</h3>
          <p className="text-xl">
            ${(selectedFlight?.price || 0) + (selectedHotel?.price || 0)}
          </p>
        </div>

        <div className="flex space-x-4">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleConfirm}>Confirm Booking</Button>
        </div>
      </div>
    </div>
  );
}

function BookingConfirmation() {
  const { state } = use(BookingContext)!;
  const { selectedFlight, selectedHotel } = state;

  return (
    <div className="text-center space-y-6">
      <div className="text-6xl">🎉</div>
      <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
      <p className="text-gray-600">
        Thank you for booking with us. Your confirmation details have been sent
        to your email.
      </p>
      <div className="p-4 border rounded inline-block text-left">
        <h3 className="font-bold mb-2">Booking Reference</h3>
        <p>Flight: {selectedFlight?.airline}</p>
        <p>Hotel: {selectedHotel?.name}</p>
      </div>
    </div>
  );
}

// Main Component
function BookingFlow() {
  const initialState: BookingState = {
    currentStep: Step.FLIGHT_SEARCH,
    flightSearch: {
      destination: '',
      departure: '',
      arrival: '',
      passengers: 1,
      isOneWay: false,
    },
    selectedFlight: null,
    hotelSearch: {
      checkIn: '',
      checkOut: '',
      guests: 1,
      roomType: 'standard',
    },
    selectedHotel: null,
  };

  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const renderStep = () => {
    switch (state.currentStep) {
      case Step.FLIGHT_SEARCH:
        return <FlightBookingForm />;
      case Step.FLIGHT_RESULTS:
        return <FlightSearchResults />;
      case Step.HOTEL_SEARCH:
        return <HotelBookingForm />;
      case Step.HOTEL_RESULTS:
        return <HotelSearchResults />;
      case Step.REVIEW:
        return <BookingReview />;
      case Step.CONFIRMATION:
        return <BookingConfirmation />;
      default:
        return null;
    }
  };

  return (
    <BookingContext.Provider value={{ state, dispatch }}>
      <div className="w-full max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Flight & Hotel Booking</h1>
        {renderStep()}
      </div>
    </BookingContext.Provider>
  );
}

export default function Page() {
  return <BookingFlow />;
}
