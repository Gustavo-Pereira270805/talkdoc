import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ChatPage from './pages/ChatPage'
import ConversationsPage from './pages/ConversationsPage'
import UploadPage from './pages/UploadPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5_000 },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Sidebar />
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/conversas" element={<ConversationsPage />} />
          <Route path="/conversas/:id" element={<ChatPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
