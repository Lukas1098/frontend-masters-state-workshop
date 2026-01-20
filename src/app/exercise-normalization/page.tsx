'use client';

import { useReducer, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, MapPin, CheckSquare } from 'lucide-react';

// Types
interface TodoItem {
  id: string;
  text: string;
  destinationId: string;
}

interface Destination {
  id: string;
  name: string;
}

interface NormalizedState {
  destinations: { [id: string]: Destination };
  todos: { [id: string]: TodoItem };
}

// Action types
type Action =
  | { type: 'ADD_DESTINATION' }
  | { type: 'UPDATE_DESTINATION'; destinationId: string; name: string }
  | { type: 'DELETE_DESTINATION'; destinationId: string }
  | { type: 'ADD_TODO'; destinationId: string; text: string }
  | { type: 'DELETE_TODO'; todoId: string };

// Reducer function
function itineraryReducer(
  state: NormalizedState,
  action: Action
): NormalizedState {
  switch (action.type) {
    case 'ADD_DESTINATION': {
      const newId = crypto.randomUUID();
      return {
        ...state,
        destinations: {
          ...state.destinations,
          [newId]: { id: newId, name: '' },
        },
      };
    }

    case 'UPDATE_DESTINATION':
      return {
        ...state,
        destinations: {
          ...state.destinations,
          [action.destinationId]: {
            ...state.destinations[action.destinationId],
            name: action.name,
          },
        },
      };

    case 'DELETE_DESTINATION': {
      const { [action.destinationId]: removed, ...remainingDestinations } = 
        state.destinations;
      
      // También eliminar todos los todos de ese destino
      const remainingTodos = Object.fromEntries(
        Object.entries(state.todos).filter(
          ([_, todo]) => todo.destinationId !== action.destinationId
        )
      );
      
      return {
        destinations: remainingDestinations,
        todos: remainingTodos,
      };
    }

    case 'ADD_TODO': {
      const newId = crypto.randomUUID();
      return {
        ...state,
        todos: {
          ...state.todos,
          [newId]: {
            id: newId,
            text: action.text,
            destinationId: action.destinationId,
          },
        },
      };
    }

    case 'DELETE_TODO': {
      const { [action.todoId]: removed, ...remainingTodos } = state.todos;
      return {
        ...state,
        todos: remainingTodos,
      };
    }

    default:
      return state;
  }
}

export default function ItineraryPage() {
  const [state, dispatch] = useReducer(itineraryReducer, {
    destinations: {},
    todos: {},
  });
  const lastInputRef = useRef<HTMLInputElement>(null);

  const handleAddDestination = () => {
    dispatch({ type: 'ADD_DESTINATION' });
    // Focus the new input after render
    setTimeout(() => {
      lastInputRef.current?.focus();
    }, 0);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">
            Travel Itinerary
          </h1>
        </div>

        <Button onClick={handleAddDestination} size="lg" className="mb-6">
          <Plus className="h-4 w-4" />
          Add Destination
        </Button>

        <div className="space-y-6">
          {Object.values(state.destinations).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No destinations yet. Click &ldquo;Add Destination&rdquo; to
                  start planning your trip!
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.values(state.destinations).map((destination, index) => (
              <Card key={destination.id} className="relative">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <CardTitle className="flex-1">
                      <Input
                        type="text"
                        value={destination.name}
                        onChange={(e) =>
                          dispatch({
                            type: 'UPDATE_DESTINATION',
                            destinationId: destination.id,
                            name: e.target.value,
                          })
                        }
                        placeholder="Enter destination name"
                        className="text-lg font-semibold border-none px-0 focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-primary rounded-none"
                        ref={
                          index === Object.values(state.destinations).length - 1
                            ? lastInputRef
                            : null
                        }
                      />
                    </CardTitle>
                  </div>
                  <CardAction>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        dispatch({
                          type: 'DELETE_DESTINATION',
                          destinationId: destination.id,
                        })
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardAction>
                </CardHeader>

                <CardContent className="space-y-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const input = form.elements.namedItem(
                        'todo'
                      ) as HTMLInputElement;
                      if (input.value.trim()) {
                        dispatch({
                          type: 'ADD_TODO',
                          destinationId: destination.id,
                          text: input.value.trim(),
                        });
                        input.value = '';
                      }
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      type="text"
                      name="todo"
                      placeholder="Add a todo item (e.g., Visit museum, Try local cuisine)"
                      className="flex-1"
                    />
                    <Button type="submit" size="sm">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </form>

                  {Object.values(state.todos).filter(todo => todo.destinationId === destination.id).length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Things to do
                        </span>
                        <Badge variant="secondary">
                          {Object.values(state.todos).filter(todo => todo.destinationId === destination.id).length}
                        </Badge>
                      </div>
                      <ul className="space-y-2">
                        {Object.values(state.todos).filter(todo => todo.destinationId === destination.id).map((todo) => (
                          <li
                            key={todo.id}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                          >
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                            <span className="flex-1 text-sm">{todo.text}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                dispatch({
                                  type: 'DELETE_TODO',
                                  todoId: todo.id,
                                })
                              }
                              className="text-muted-foreground hover:text-destructive h-auto p-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No activities added yet. Add some things to do at this
                      destination!
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-6 border-t">
        <Button variant="outline" disabled>
          Undo
        </Button>
        <Button variant="outline" disabled>
          Redo
        </Button>
      </div>
    </div>
  );
}
