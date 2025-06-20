"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { withAuth } from "../withAuth";

type Movie = {
  id: string;
  title: string;
  description?: string;
  duration: string;
  poster?: string;
};

type Room = {
  id: string;
  name: string;
  capacity: number;
  layout: {
    rows: string[];
    columns: number[];
    seats: Record<string, Record<string, string>>;
  };
};

type Screening = {
  id: string;
  movieId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  price: number;
};

type WeekDate = { dateObj: Date; formattedDate: string; isoDate: string };

const generateDefaultLayout = (roomId: string) => {
  const rows = ["A", "B", "C", "D", "E", "F", "G"];
  const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  
  const seats: Record<string, Record<string, string>> = {};
  rows.forEach(row => {
    seats[row] = {};
    columns.forEach(column => {
      const stateSeed = `${roomId}-${row}-${column}`;
      const stateHash = Array.from(stateSeed).reduce((acc, char) => 
        acc + char.charCodeAt(0), 0) % 100;
      seats[row][column] = stateHash < 10 ? "occupied" : "available";
    });
  });

  return {
    rows,
    columns,
    seats
  };
};

function AdminPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [globalPrice, setGlobalPrice] = useState("");
  const [screeningTimes, setScreeningTimes] = useState<Record<string, string>>({});
  const [formActive, setFormActive] = useState(false);
  const [loadingScreenings, setLoadingScreenings] = useState(true);

  const getWeekDates = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        dateObj: date,
        formattedDate: date.toLocaleDateString('es-ES', options),
        isoDate: date.toISOString().split('T')[0]
      });
    }
    return days;
  };

  const weekDates: WeekDate[] = getWeekDates();

  useEffect(() => {
    fetchData();
    
    const initialTimes: Record<string, string> = {};
    weekDates.forEach(day => {
      initialTimes[day.isoDate] = "";
    });
    setScreeningTimes(initialTimes);
  }, []);

  const fetchData = async () => {
    try {
      const moviesRes = await fetch("http://localhost:4000/api/movies", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const moviesData = await moviesRes.json();
      setMovies(moviesData.movies || []);

      const roomsRes = await fetch("http://localhost:4000/api/rooms", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const roomsData = await roomsRes.json();
      setRooms(roomsData.rooms || []);

    } catch {
      toast.error("Error al cargar datos");
    }

    try {
      setLoadingScreenings(true);
      const screeningsRes = await fetch("http://localhost:4000/api/screening", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      if (!screeningsRes.ok) {
        throw new Error(`Error ${screeningsRes.status}: ${screeningsRes.statusText}`);
      }
      
      const screeningsData = await screeningsRes.json();
      setScreenings(screeningsData.screenings || []);
    } catch (error) {
      console.error("Error al cargar funciones:", error);
      toast.error("Error al cargar funciones. Por favor, intente más tarde.");
    } finally {
      setLoadingScreenings(false);
    }
  };

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setTitle(movie.title);
    setDescription(movie.description || "");
    setDuration(movie.duration);
    setImagePreview(movie.poster ?? null);
    setIsEditing(true);
    setFormActive(true);
  };

  const handleSaveMovie = async () => {
    if(!isEditing) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('duration', duration);
    formData.append('rating', '5');
    
    if (image) {
      formData.append('image', image);
    } else if (!selectedMovie) {
      toast.error('Debes subir una imagen para nuevas películas');
      return;
    }

    try {
      const url = `http://localhost:4000/api/movies${selectedMovie ? `/${selectedMovie.id}` : ''}`;
      const method = selectedMovie ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      const data = await res.json();
      toast.success(selectedMovie ? 'Película actualizada' : 'Película creada');
      
      if (!selectedMovie) {
        setSelectedMovie(data.movie);
      }
      
      fetchData();
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido");
    }
  };

  const resetForm = () => {
    setSelectedMovie(null);
    setTitle("");
    setDescription("");
    setDuration("");
    setImage(null);
    setImagePreview(null);
    setIsEditing(true);
    setFormActive(false);
  };

  const handleImagePreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file){
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDeleteMovie = async () => {
    if (!selectedMovie) return;
    
    try {
      const res = await fetch(`http://localhost:4000/api/movies/${selectedMovie.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.ok) {
        toast.success("Película eliminada");
        fetchData();
        resetForm();
      }
    } catch {
      toast.error("Error al eliminar película");
    }
  };

  const handleCreateScreening = async (date: string, time: string) => {
    try {
      if (!selectedMovie) {
        toast.error("Debe seleccionar una película");
        return;
      }
      
      if (!globalPrice) {
        toast.error("Debe establecer un precio global primero");
        return;
      }

      const startTimeISO = `${date}T${time}:00`;
      const movieDuration = Number(selectedMovie.duration) || 120;
      const endDateTime = new Date(new Date(startTimeISO).getTime() + movieDuration * 60000);
      const endTimeISO = endDateTime.toISOString();

      // 1. Crear nueva sala con layout único
      const roomNumbers = rooms
        .filter(room => room.name.startsWith("Sala "))
        .map(room => {
          const match = room.name.match(/Sala (\d+)/);
          return match ? parseInt(match[1]) : 0;
        });
      
      const maxRoomNumber = Math.max(0, ...roomNumbers);
      const newRoomNumber = maxRoomNumber + 1;
      const roomName = `Sala ${newRoomNumber}`;
      
      const uniqueRoomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newLayout = generateDefaultLayout(uniqueRoomId);
      
      const roomRes = await fetch("http://localhost:4000/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ 
          name: roomName,
          capacity: 91,
          layout: newLayout
        }),
      });

      if (!roomRes.ok) {
        const errorData = await roomRes.json();
        toast.error(errorData.error || "Error al crear sala");
        return;
      }

      const roomData = await roomRes.json();
      const roomToUse = roomData.room;
      
      if (!roomToUse) {
        toast.error("Error al obtener datos de la nueva sala");
        return;
      }

      // 2. Crear la función con la nueva sala
      const screeningRes = await fetch("http://localhost:4000/api/screening", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          movieId: selectedMovie.id,
          roomId: roomToUse.id,
          startTime: startTimeISO,
          endTime: endTimeISO,
          price: Number(globalPrice),
        }),
      });

      if (screeningRes.ok) {
        toast.success("Función creada exitosamente");
        const newScreening = await screeningRes.json();
        setScreenings(prev => [...prev, newScreening.screening]);
        setRooms(prev => [...prev, roomToUse]);
        setScreeningTimes(prev => ({ ...prev, [date]: "" }));
      } else {
        const error = await screeningRes.json();
        toast.error(error.error || "Error al crear función");
      }
    } catch (error) {
      toast.error("Error al crear función: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleDeleteScreening = async (screeningId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/screening/${screeningId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.ok) {
        toast.success("Función eliminada");
        setScreenings(prev => prev.filter(s => s.id !== screeningId));
      } else {
        const error = await res.json();
        throw new Error(error.error || "Error al eliminar función");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-purple-700 py-4 flex justify-between items-center px-6">
        <h1 className="text-2xl font-bold text-white">CineClic Admin</h1>
        <div className="relative">
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="bg-pink-500 text-white px-4 py-2 rounded-full hover:bg-violet-400 transition-colors"
          >
            Administrador
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-white text-black rounded-lg shadow-lg w-48">
              <button 
                onClick={() => router.push("/login")} 
                className="block w-full text-left px-4 py-2 hover:bg-gray-200"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex flex-col gap-6 px-6 py-8">
        {/* SECCION DE PELICULAS */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Gestión de Películas</h2>
          
          <div className="flex gap-6">
            {/* listado de peliculas */}
            <div className="w-1/3">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {movies.length === 0 ? (
                  <p className="text-gray-500">No hay películas registradas</p>
                ) : (
                  movies.map((movie) => (
                    <button
                      key={movie.id}
                      onClick={() => handleSelectMovie(movie)}
                      className={`w-full text-left p-2 rounded ${
                        selectedMovie?.id === movie.id 
                          ? "bg-purple-200 font-medium" 
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {movie.title}
                    </button>
                  ))
                )}
              </div>
              <button 
                onClick={() => { resetForm(); setIsEditing(true); setFormActive(true); }}
                className="bg-green-500 text-white px-3 py-2 rounded-md mt-4 w-full"
              >
                + Agregar película
              </button>
            </div>

            {/* formulario de pelicula */}
            <div className="w-2/3">
              <h3 className="text-lg font-bold mb-2">
                {formActive 
                  ? (selectedMovie ? "Editar Película" : "Nueva Película") 
                  : "Selecciona una película para editar"}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  {imagePreview && (
                    <Image 
                      src={imagePreview} 
                      alt="Preview" 
                      width={200} 
                      height={300} 
                      className="rounded-md mb-4 object-cover w-full h-64 border"
                    />
                  )}
                  <input
                    type="file"
                    onChange={handleImagePreview}
                    className="w-full border p-2 rounded"
                    disabled={!formActive}
                  />
                </div>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título"
                    className="w-full border p-2 rounded"
                    disabled={!formActive}
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Sinopsis"
                    className="w-full border p-2 rounded"
                    rows={4}
                    disabled={!formActive}
                  />
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Duración (minutos)"
                    className="w-full border p-2 rounded"
                    disabled={!formActive}
                  />
                </div>
              </div>
            {formActive && (
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSaveMovie}
                  disabled={!title || !duration || (!selectedMovie && !image)}
                  className="bg-blue-500 text-white px-6 py-2 rounded-md disabled:bg-gray-400"
                >
                  Guardar
                </button>
                <button
                  onClick={resetForm}
                  className="bg-gray-400 text-white px-6 py-2 rounded-md"
                >
                  Cancelar
                </button>
                {selectedMovie && (
                  <button
                    onClick={handleDeleteMovie}
                    className="bg-red-500 text-white px-6 py-2 rounded-md"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* PROGRAMACION DE FUNCIONES */}
        {selectedMovie && (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">
              Programar Funciones para: <span className="text-purple-700">{selectedMovie.title}</span>
            </h2>
            
            {/* campo de precio global */}
            <div className="mb-6 flex items-center gap-4">
              <label className="font-medium">Precio global para todas las funciones:</label>
              <input
                type="number"
                value={globalPrice}
                onChange={(e) => setGlobalPrice(e.target.value)}
                placeholder="Precio"
                className="border p-2 rounded w-32"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4">
              {weekDates.map((day) => {
                const dayTime = screeningTimes[day.isoDate] || "";
                const dayScreenings = screenings.filter(s => {
                  const screeningDate = new Date(s.startTime).toISOString().split('T')[0];
                  return screeningDate === day.isoDate && s.movieId === selectedMovie.id;
                });

                return (
                  <div key={day.isoDate} className="min-w-[220px] border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-bold text-lg mb-3 text-center">
                      {day.formattedDate}
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Hora:</label>
                        <input
                          type="time"
                          value={dayTime}
                          onChange={(e) => 
                            setScreeningTimes(prev => ({
                              ...prev,
                              [day.isoDate]: e.target.value
                            }))
                          }
                          className="w-full border p-2 rounded"
                        />
                      </div>
                      
                      <button
                        onClick={() => handleCreateScreening(day.isoDate, dayTime)}
                        disabled={!dayTime || !globalPrice}
                        className="bg-green-500 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
                      >
                        Programar
                      </button>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Funciones programadas:</h4>
                      
                      {loadingScreenings ? (
                        <p className="text-gray-500 text-sm italic">Cargando funciones...</p>
                      ) : dayScreenings.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No hay funciones programadas</p>
                      ) : (
                        dayScreenings.map(screening => {
                          const room = rooms.find(r => r.id === screening.roomId);
                          const startTime = new Date(screening.startTime).toTimeString().slice(0,5);
                          return (
                            <div 
                              key={screening.id} 
                              className="bg-white p-2 rounded border mb-2 flex justify-between items-center"
                            >
                              <div>
                                <div className="font-medium">
                                  {startTime}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Sala: {room?.name || 'No encontrada'} | 
                                  Precio: {screening.price}€
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteScreening(screening.id)}
                                className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                              >
                                Eliminar
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default withAuth(AdminPage, { allowedRoles: ["admin"] });