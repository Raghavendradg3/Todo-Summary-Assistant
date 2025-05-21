"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  X,
  Check,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  User,
  Moon,
  Sun,
  Search,
  Calendar,
  Star,
  Clock,
} from "lucide-react"
import { Input } from "./components/ui/input"
import { Checkbox } from "./components/ui/checkbox"
import { Card, CardContent } from "./components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Toaster } from "./components/ui/toaster"
import { useToast } from "./components/ui/use-toast"
import { useTheme } from "./components/theme-provider"
import LoginForm from "./components/LoginForm"
import RegisterForm from "./components/RegisterForm"

function App() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState("")
  const [filter, setFilter] = useState("all")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState("login")
  const [isLoading, setIsLoading] = useState(true)
  const [completedTodoId, setCompletedTodoId] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const { theme, setTheme } = useTheme()

  const { toast } = useToast()

  const API_URL = "http://localhost:5000/api"

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    if (token) {
      fetchUserData(token)
    } else {
      setTimeout(() => setIsLoading(false), 1500) // Add delay for animation
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos()
    } else {
      setTodos([])
    }
  }, [isAuthenticated])

  const fetchUserData = async (token) => {
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem("token")
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setTimeout(() => setIsLoading(false), 1500) // Add delay for animation
    }
  }

  const fetchTodos = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/todos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTodos(data)
      }
    } catch (error) {
      console.error("Error fetching todos:", error)
      toast({
        title: "Error",
        description: "Failed to load todos",
        variant: "destructive",
      })
    }
  }

  const addTodo = async (e) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTodo, completed: false }),
      })

      if (response.ok) {
        const data = await response.json()
        setTodos([...todos, data])
        setNewTodo("")
        toast({
          title: "Success",
          description: "Todo added successfully",
        })
      }
    } catch (error) {
      console.error("Error adding todo:", error)
      toast({
        title: "Error",
        description: "Failed to add todo",
        variant: "destructive",
      })
    }
  }

  const toggleTodo = async (id, completed) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !completed }),
      })

      if (response.ok) {
        setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))

        if (!completed) {
          toast({
            title: "Success! 🎉",
            description: "Todo completed",
          })
        }
      }
    } catch (error) {
      console.error("Error toggling todo:", error)
      toast({
        title: "Error",
        description: "Failed to update todo",
        variant: "destructive",
      })
    }
  }

  const startEditing = (id, title) => {
    setEditingId(id)
    setEditText(title)
  }

  const saveEdit = async () => {
    if (!editText.trim()) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/todos/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editText }),
      })

      if (response.ok) {
        setTodos(todos.map((todo) => (todo.id === editingId ? { ...todo, title: editText } : todo)))
        setEditingId(null)
        toast({
          title: "Success",
          description: "Todo updated successfully",
        })
      }
    } catch (error) {
      console.error("Error updating todo:", error)
      toast({
        title: "Error",
        description: "Failed to update todo",
        variant: "destructive",
      })
    }
  }

  const deleteTodo = async (id) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setTodos(todos.filter((todo) => todo.id !== id))
        toast({
          title: "Success",
          description: "Todo deleted successfully",
        })
      }
    } catch (error) {
      console.error("Error deleting todo:", error)
      toast({
        title: "Error",
        description: "Failed to delete todo",
        variant: "destructive",
      })
    }
  }

  const handleLogin = (userData, token) => {
    localStorage.setItem("token", token)
    setUser(userData)
    setIsAuthenticated(true)
    setShowAuthModal(false)
    toast({
      title: "Welcome back!",
      description: `Logged in as ${userData.username}`,
    })
  }

  const handleRegister = () => {
    setAuthMode("login")
    toast({
      title: "Account created",
      description: "Please log in with your new account",
    })
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setIsAuthenticated(false)
    setUser(null)
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const toggleSearch = () => {
    setShowSearch(!showSearch)
    if (!showSearch) {
      setTimeout(() => document.getElementById("searchInput").focus(), 100)
    } else {
      setSearchQuery("")
    }
  }

  const filteredTodos = todos.filter((todo) => {
    // First apply search filter
    if (searchQuery && !todo.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Then apply tab filter
    if (filter === "active") return !todo.completed
    if (filter === "completed") return todo.completed
    return true
  })

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
      <Toaster />

      <div className="max-w-md mx-auto p-4 sm:p-6 md:p-8">
        <motion.header
          className="mb-8 flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <motion.div
              className="mr-3 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg"
              whileHover={{ rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Check className="w-6 h-6" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
              Todo App
            </h1>
          </motion.div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={toggleSearch}
            >
              <Search className="w-5 h-5" />
            </motion.button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <motion.div
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-gray-800 shadow-md text-sm text-gray-700 dark:text-gray-300"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <User className="w-4 h-4" />
                  <span className="font-medium">{user?.username}</span>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-gray-800 shadow-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-gray-800 shadow-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => {
                  setAuthMode("login")
                  setShowAuthModal(true)
                }}
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </motion.button>
            )}
          </div>
        </motion.header>

        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="relative">
                <Input
                  id="searchInput"
                  type="text"
                  placeholder="Search todos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md rounded-full"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isAuthenticated ? (
          <>
            <motion.form
              onSubmit={addTodo}
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="relative flex items-center">
                <Input
                  type="text"
                  placeholder="Add a new task..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  className="pr-12 border-purple-200 focus:border-purple-400 focus:ring-purple-400 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md rounded-full"
                />
                <motion.button
                  type="submit"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 w-10 h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!newTodo.trim()}
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Tabs defaultValue="all" className="mb-6" onValueChange={setFilter}>
                <TabsList className="grid grid-cols-3 mb-4 p-1 bg-white dark:bg-gray-800 rounded-full shadow-md">
                  <TabsTrigger
                    value="all"
                    className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="active"
                    className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
                  >
                    Active
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
                  >
                    Completed
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                  <TodoList
                    todos={filteredTodos}
                    editingId={editingId}
                    editText={editText}
                    setEditText={setEditText}
                    toggleTodo={toggleTodo}
                    startEditing={startEditing}
                    saveEdit={saveEdit}
                    deleteTodo={deleteTodo}
                  />
                </TabsContent>
                <TabsContent value="active" className="mt-0">
                  <TodoList
                    todos={filteredTodos}
                    editingId={editingId}
                    editText={editText}
                    setEditText={setEditText}
                    toggleTodo={toggleTodo}
                    startEditing={startEditing}
                    saveEdit={saveEdit}
                    deleteTodo={deleteTodo}
                  />
                </TabsContent>
                <TabsContent value="completed" className="mt-0">
                  <TodoList
                    todos={filteredTodos}
                    editingId={editingId}
                    editText={editText}
                    setEditText={setEditText}
                    toggleTodo={toggleTodo}
                    startEditing={startEditing}
                    saveEdit={saveEdit}
                    deleteTodo={deleteTodo}
                  />
                </TabsContent>
              </Tabs>
            </motion.div>

            <motion.div
              className="text-center text-sm text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {todos.length === 0 ? (
                <p>No tasks yet. Add your first task above!</p>
              ) : (
                <div className="flex justify-center items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                  <p>{todos.filter((t) => !t.completed).length} tasks left to complete</p>
                </div>
              )}
            </motion.div>
          </>
        ) : (
          <WelcomeScreen setShowAuthModal={setShowAuthModal} setAuthMode={setAuthMode} />
        )}
      </div>

      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            authMode={authMode}
            setAuthMode={setAuthMode}
            onClose={() => setShowAuthModal(false)}
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-20 h-20 mx-auto mb-6 relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 opacity-30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-700 opacity-50"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
          <motion.div
            className="absolute inset-4 rounded-full bg-gradient-to-r from-purple-700 to-indigo-800 flex items-center justify-center text-white"
            animate={{ rotate: 360 }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            <Check className="w-6 h-6" />
          </motion.div>
        </motion.div>
        <motion.h2
          className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Todo App
        </motion.h2>
        <motion.p
          className="text-gray-600 dark:text-gray-300"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Loading your tasks...
        </motion.p>
      </motion.div>
    </div>
  )
}

function WelcomeScreen({ setShowAuthModal, setAuthMode }) {
  return (
    <motion.div
      className="py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <motion.div
        className="max-w-sm mx-auto text-center"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.div
          className="w-24 h-24 mx-auto mb-6 relative"
          whileHover={{ rotate: 5, scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rotate-6" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <Check className="w-12 h-12" />
          </div>
        </motion.div>

        <motion.h2
          className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Welcome to Todo App
        </motion.h2>

        <motion.p
          className="mb-8 text-gray-600 dark:text-gray-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          The most beautiful and intuitive way to organize your tasks. Stay productive and never miss a deadline.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <motion.button
            onClick={() => {
              setAuthMode("login")
              setShowAuthModal(true)
            }}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-lg hover:shadow-xl transition-shadow"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.5)" }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started
          </motion.button>

          <motion.button
            onClick={() => {
              setAuthMode("register")
              setShowAuthModal(true)
            }}
            className="px-6 py-3 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium shadow-md hover:shadow-lg transition-shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create Account
          </motion.button>
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-lg mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <FeatureCard
          icon={<Check className="w-6 h-6" />}
          title="Stay Organized"
          description="Keep track of all your tasks in one beautiful place"
          delay={0.7}
        />
        <FeatureCard
          icon={<Clock className="w-6 h-6" />}
          title="Never Miss a Deadline"
          description="Set due dates and get reminders for important tasks"
          delay={0.8}
        />
        <FeatureCard
          icon={<Star className="w-6 h-6" />}
          title="Boost Productivity"
          description="Focus on what matters most and get more done"
          delay={0.9}
        />
      </motion.div>
    </motion.div>
  )
}

function FeatureCard({ icon, title, description, delay }) {
  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
    >
      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </motion.div>
  )
}

function AuthModal({ authMode, setAuthMode, onClose, onLogin, onRegister }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <motion.button
            className="absolute right-0 top-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>

          <motion.div
            className="mb-6 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              {authMode === "login" ? <LogIn className="w-8 h-8" /> : <User className="w-8 h-8" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {authMode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
              {authMode === "login" ? "Sign in to access your tasks" : "Sign up to start organizing your tasks"}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={authMode}
              initial={{ opacity: 0, x: authMode === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: authMode === "login" ? 20 : -20 }}
              transition={{ duration: 0.3 }}
            >
              {authMode === "login" ? <LoginForm onLogin={onLogin} /> : <RegisterForm onRegister={onRegister} />}
            </motion.div>
          </AnimatePresence>

          <motion.div
            className="mt-6 text-center text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <span className="text-gray-600 dark:text-gray-300">
              {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <motion.button
              onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {authMode === "login" ? "Sign up" : "Log in"}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function TodoList({ todos, editingId, editText, setEditText, toggleTodo, startEditing, saveEdit, deleteTodo }) {
  return (
    <motion.div className="space-y-2">
      <AnimatePresence>
        {todos.map((todo) => (
          <motion.div
            key={todo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: todo.id === completedTodoId ? [1, 1.05, 1] : 1,
            }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-2 p-3 bg-card rounded-lg border ${
              todo.completed ? "opacity-60" : ""
            }`}
          >
            <Checkbox
              checked={todo.completed}
              onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
              className="data-[state=checked]:bg-green-500"
            />
            {editingId === todo.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  saveEdit()
                }}
                className="flex-1 flex gap-2"
              >
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button onClick={saveEdit} size="icon" variant="ghost">
                  <Check className="h-4 w-4" />
                </Button>
                <Button onClick={() => setEditingId(null)} size="icon" variant="ghost">
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <>
                <span className="flex-1">{todo.title}</span>
                <Button onClick={() => startEditing(todo.id, todo.title)} size="icon" variant="ghost">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button onClick={() => deleteTodo(todo.id)} size="icon" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

export default App
