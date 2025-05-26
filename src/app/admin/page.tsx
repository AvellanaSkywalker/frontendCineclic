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
};

type Screening = {
  id: string;
  movieId: string;
  roomId: string;
  date: string;
  time: string;

};

export default function AdminPage() {
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
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [roomId, setRoomId] = useState("");
  const [activeTab, setActiveTab] = useState("movies");
  const [price, setPrice] = useState("");

  // Generar fechas para los próximos 7 días
  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar la fecha
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "admin") router.push("/");
  }, [router]);

  const fetchData = async () => {
    try {
      // Obtener películas
      const moviesRes = await fetch("http://localhost:4000/api/movies", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const moviesData = await moviesRes.json();
      setMovies(moviesData.movies || []);

      // Obtener salas
      const roomsRes = await fetch("http://localhost:4000/api/rooms", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const roomsData = await roomsRes.json();
      setRooms(roomsData.rooms || []);

      const screeningsRes = await fetch("http://localhost:4000/api/screening", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const screeningsData = await screeningsRes.json();
      setScreenings(screeningsData.screenings || []);

    } catch {
      toast.error("Error al cargar datos");
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Manejar selección/edición de película
  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setTitle(movie.title);
    setDescription(movie.description || "");
    setDuration(movie.duration);
    setImagePreview(movie.poster ?? null);
    setIsEditing(true);
  };

  // Habilitar modo creación nueva película
  const handleSaveMovie = async () => {
  if(!isEditing) return;

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description); // Mapea a 'description' del backend
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
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }

    await res.json();
    toast.success(selectedMovie ? 'Película actualizada' : 'Película creada');
    fetchData();
    resetForm();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Error desconocido");
  }
};

  const resetForm = () => {
  setSelectedMovie(null);
  setTitle("");
  setDescription(""); // Cambiado a synopsis si es el caso
  setDuration("");
  setImage(null);
  setImagePreview(null);
  setIsEditing(true);
};

  // Manejar subida de imagen
  const handleImagePreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file){
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setIsEditing(true);
    }
    setImage(file ?? null);
    if (file) setImagePreview(URL.createObjectURL(file));
  };



  // Eliminar película
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
        setIsEditing(false);
      }
    } catch {
      toast.error("Error al eliminar película");
    }
  };

  // Crear nueva función
 const handleCreateScreening = async () => {
  try {
    if (!selectedMovie) {
      toast.error("Debe seleccionar una película");
      return;
    }

    // Calcula endTime (startTime + duración de la película)
    const [hours, minutes] = time.split(":").map(Number);
    const startDateTime = new Date();
    startDateTime.setHours(hours, minutes, 0, 0);

    const movieDuration = Number(selectedMovie.duration) || 120; // 120 mins (2h) por defecto
    const endDateTime = new Date(startDateTime.getTime() + movieDuration * 60000); // +duració en milisegundos

    const endTime = endDateTime.toTimeString().slice(0, 5); // Formato "HH:MM"

    const res = await fetch("http://localhost:4000/api/screening", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        movieId: selectedMovie.id,
        roomId: roomId,
        date,
        startTime: time,  // Hora de inicio ej: "14:30
        endTime: endTime,  // Hora de fin calculada ej: "16:30"
        price: Number(price),
      }),
    });

    if (res.ok) {
      toast.success("Función creada exitosamente");
      fetchData();
      setDate("");
      setTime("");
      setRoomId("");
      setPrice("");
    }
  } catch {
    toast.error("Error al crear función");
  }
};

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-purple-700 py-4 flex justify-between items-center px-6">
        <h1 className="text-2xl font-bold text-white">CineClic Admin</h1>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="bg-pink-500 text-white px-4 py-2 rounded-lg">
            Administrador
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-white text-black rounded-lg shadow-lg w-48">
              <button onClick={() => router.push("/login")} className="block w-full text-left px-4 py-2 hover:bg-gray-200">
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex flex-row gap-6 flex-1 px-6 py-8">
        <div className="w-1/3 bg-white p-4 rounded-lg shadow-md">
          <div className="flex flex-col gap-2 mb-4">
            <button onClick={() => setActiveTab("movies")} className={`p-2 ${activeTab === "movies" ? "bg-purple-600 text-white" : "bg-gray-200"}`}>
              Películas
            </button>
            <button onClick={() => setActiveTab("screenings")} className={`p-2 ${activeTab === "screenings" ? "bg-purple-600 text-white" : "bg-gray-200"}`}>
              Funciones
            </button>
          </div>

          {activeTab === "movies" && (
            <>
              <h2 className="text-xl font-bold mb-2">Películas</h2>
              {movies.length === 0 ? (
                <p className="text-gray-500">No hay películas registradas</p>
              ) : (
                <div className="space-y-2">
                  {movies.map((movie) => (
                    <button
                      key={movie.id}
                      onClick={() => handleSelectMovie(movie)}
                      className={`w-full text-left p-2 rounded ${
                        selectedMovie?.id === movie.id ? "bg-purple-200" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {movie.title}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={()  => {
                    resetForm();
                  setIsEditing(true);
                  }}
                  className="bg-green-500 text-white px-3 py-2 rounded-md"
                  >
                  + Agregar película
                </button>
              </div>
            </>
          )}

          {activeTab === "screenings" && (
            <>
              <h2 className="text-xl font-bold mb-2">Salas Disponibles</h2>
              {rooms.length === 0 ? (
                <p className="text-gray-500">No hay salas registradas</p>
              ) : (
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div key={room.id} className="p-2 bg-gray-100 rounded">
                      {room.name} (Capacidad: {room.capacity})
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Seccin derecha - Formularios */}
        <div className="w-2/3 bg-white p-4 rounded-lg shadow-md">
          {activeTab === "movies" && (
            <>
              <h2 className="text-xl font-bold mb-4">
                {selectedMovie ? "Editar Película" : "Nueva Película"}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  {imagePreview && (
                    <Image src={imagePreview} alt="Preview" width={200} height={300} className="rounded-md mb-4" />
                  )}
                  <input
                    type="file"
                    onChange={handleImagePreview}
                    className="w-full border p-2 rounded"
                    disabled={!isEditing || activeTab !== "movies"}
                  />
                </div>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título"
                    className="w-full border p-2 rounded"
                    disabled={!isEditing || activeTab !== "movies"}
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Sinopsis"
                    className="w-full border p-2 rounded"
                    rows={4}
                    disabled={!isEditing || activeTab !== "movies"}
                  />
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Duración (minutos)"
                    className="w-full border p-2 rounded"
                    disabled={!isEditing || activeTab !== "movies"}
                  />
                  
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSaveMovie}
                  disabled={!title || !duration}
                  className="bg-blue-500 text-white px-6 py-2 rounded-md disabled:bg-gray-400"
                >
                  Guardar
                </button>
                <button
                  onClick={handleSaveMovie}  
                    disabled={!title || !duration || !imagePreview}
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
            </>
          )}

          {activeTab === "screenings" && (
            <>
              <h2 className="text-xl font-bold mb-4">Programar Nueva Función</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <select
                  value={selectedMovie?.id || ""}
                  onChange={(e) => setSelectedMovie(movies.find(m => m.id == e.target.value) ?? null)}
                  className="border p-2 rounded"
                >
                  <option value="">Seleccionar Película</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>{movie.title}</option>
                  ))}
                </select>

                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="">Seleccionar Sala</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>

                <select
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="">Seleccionar Fecha</option>
                  {weekDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </option>
                  ))}
                </select>

                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="border p-2 rounded"
                />
              </div>

              <button
                onClick={handleCreateScreening}
                disabled={!selectedMovie || !roomId || !date || !time}
                className="bg-green-500 text-white px-6 py-2 rounded-md disabled:bg-gray-400"
              >
                Programar Función
              </button>

              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Funciones Programadas</h2>
                {weekDates.map(date => (
                  <div key={date} className="mb-6">
                    <h3 className="font-bold mb-2">
                      {new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                    {screenings
                      .filter(s => s.date === date)
                      .map(screening => (
                        <div key={screening.id} className="border p-2 rounded mb-2">
                          {movies.find(m => m.id === screening.movieId)?.title} - 
                          {rooms.find(r => r.id === screening.roomId)?.name} - 
                          {screening.time}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export const AdminPageWithAuth = withAuth(AdminPage, { allowedRoles: ["admin"] });