"use client"

import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  name: string
  is_master?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  saveUserData: (data: any) => Promise<void>
  loadUserData: () => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há usuário logado
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          try {
            // Buscar dados do usuário
            const { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (userData && !error) {
              setUser({
                id: userData.id,
                email: userData.email,
                name: userData.name,
                is_master: userData.is_master
              })
            } else {
              // Usar dados básicos se não encontrar na tabela
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.email?.split('@')[0] || 'Usuário',
                is_master: false
              })
            }
          } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error)
            // Usar dados básicos em caso de erro
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.email?.split('@')[0] || 'Usuário',
              is_master: false
            })
          }
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error)
        // Fallback para localStorage se Supabase não estiver disponível
        const localUser = localStorage.getItem('eventcontrol-user')
        if (localUser) {
          try {
            setUser(JSON.parse(localUser))
          } catch (e) {
            console.error('Erro ao parsear usuário local:', e)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            let userObj
            if (userData && !error) {
              userObj = {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                is_master: userData.is_master
              }
            } else {
              // Usar dados básicos se não encontrar
              userObj = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.email?.split('@')[0] || 'Usuário',
                is_master: false
              }
            }
            
            setUser(userObj)
            localStorage.setItem('eventcontrol-user', JSON.stringify(userObj))
          } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error)
            // Usar dados básicos em caso de erro
            const userObj = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.email?.split('@')[0] || 'Usuário',
              is_master: false
            }
            setUser(userObj)
            localStorage.setItem('eventcontrol-user', JSON.stringify(userObj))
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          localStorage.removeItem('eventcontrol-user')
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      // Sempre limpar dados locais
      setUser(null)
      localStorage.removeItem('eventcontrol-user')
    }
  }

  const saveUserData = async (data: any) => {
    if (!user) return

    try {
      // Tentar salvar no Supabase primeiro
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: user.id,
          ...data,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Erro ao salvar dados do usuário:', error)
        throw error
      }
    } catch (error) {
      console.error('Erro ao salvar dados do usuário:', error)
      // Fallback para localStorage se Supabase falhar
      try {
        Object.keys(data).forEach(key => {
          localStorage.setItem(`eventcontrol-${key}`, JSON.stringify(data[key]))
        })
      } catch (localError) {
        console.error('Erro ao salvar no localStorage:', localError)
      }
    }
  }

  const loadUserData = async () => {
    if (!user) return null

    try {
      // Tentar carregar do Supabase primeiro
      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Erro ao buscar dados do usuário:', error)
        throw error
      }

      if (data) {
        return {
          events: data.events || [],
          products: data.products || [],
          sales: data.sales || [],
          expenses: data.expenses || [],
          expense_categories: data.expense_categories || [
            {id: "1", name: "Decoração", expanded: false, items: []},
            {id: "2", name: "Marketing", expanded: false, items: []},
            {id: "3", name: "Logística", expanded: false, items: []},
            {id: "4", name: "Passagem Aérea", expanded: false, items: []},
            {id: "5", name: "Artista", expanded: false, items: []},
            {id: "6", name: "Hotel", expanded: false, items: []},
            {id: "7", name: "Alimentação", expanded: false, items: []}
          ],
          revenues: data.revenues || [],
          notifications: data.notifications || [],
          templates: data.templates || [],
          ticket_info: data.ticket_info || { currentTicketPrice: 50, ticketsSold: 0, eventTotalCost: 15000 }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error)
    }

    // Fallback para localStorage
    try {
      return {
        events: JSON.parse(localStorage.getItem('eventcontrol-events') || '[]'),
        products: JSON.parse(localStorage.getItem('eventcontrol-products') || '[]'),
        sales: JSON.parse(localStorage.getItem('eventcontrol-sales') || '[]'),
        expenses: JSON.parse(localStorage.getItem('eventcontrol-expenses') || '[]'),
        expense_categories: JSON.parse(localStorage.getItem('eventcontrol-expensecategories') || '[{"id":"1","name":"Decoração","expanded":false,"items":[]},{"id":"2","name":"Marketing","expanded":false,"items":[]},{"id":"3","name":"Logística","expanded":false,"items":[]},{"id":"4","name":"Passagem Aérea","expanded":false,"items":[]},{"id":"5","name":"Artista","expanded":false,"items":[]},{"id":"6","name":"Hotel","expanded":false,"items":[]},{"id":"7","name":"Alimentação","expanded":false,"items":[]}]'),
        revenues: JSON.parse(localStorage.getItem('eventcontrol-revenues') || '[]'),
        notifications: JSON.parse(localStorage.getItem('eventcontrol-notifications') || '[]'),
        templates: JSON.parse(localStorage.getItem('eventcontrol-templates') || '[]'),
        ticket_info: JSON.parse(localStorage.getItem('eventcontrol-ticketinfo') || '{"currentTicketPrice": 50, "ticketsSold": 0, "eventTotalCost": 15000}')
      }
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error)
      // Retornar dados padrão se tudo falhar
      return {
        events: [],
        products: [],
        sales: [],
        expenses: [],
        expense_categories: [
          {id: "1", name: "Decoração", expanded: false, items: []},
          {id: "2", name: "Marketing", expanded: false, items: []},
          {id: "3", name: "Logística", expanded: false, items: []},
          {id: "4", name: "Passagem Aérea", expanded: false, items: []},
          {id: "5", name: "Artista", expanded: false, items: []},
          {id: "6", name: "Hotel", expanded: false, items: []},
          {id: "7", name: "Alimentação", expanded: false, items: []}
        ],
        revenues: [],
        notifications: [],
        templates: [],
        ticket_info: { currentTicketPrice: 50, ticketsSold: 0, eventTotalCost: 15000 }
      }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signOut,
      saveUserData,
      loadUserData
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}