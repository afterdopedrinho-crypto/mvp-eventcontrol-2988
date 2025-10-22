import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase com variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Verificar se as variáveis estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variáveis do Supabase não configuradas. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Tipos para as tabelas
export interface User {
  id: string
  username: string
  email: string
  password?: string
  role: 'admin' | 'user'
  provider?: 'email' | 'google'
  created_at: string
  last_login?: string
}

// Função para inicializar banco de dados (criar tabela users se não existir)
export const initializeDatabase = async () => {
  try {
    // Criar tabela users se não existir
    const { error } = await supabase.rpc('create_users_table_if_not_exists')
    
    if (error && !error.message.includes('already exists')) {
      console.error('Erro ao criar tabela users:', error)
    } else {
      console.log('✅ Tabela users disponível')
    }
  } catch (error) {
    console.log('Tabela users já existe ou será criada automaticamente')
  }
}

// Função para criar usuário no Supabase
export const createUser = async (userData: {
  username: string
  email: string
  password: string
  role?: string
  provider?: string
}) => {
  try {
    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${userData.username},email.eq.${userData.email}`)
      .single()

    if (existingUser) {
      throw new Error('Usuário ou email já existe')
    }

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          role: userData.role || 'user',
          provider: userData.provider || 'email',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return { data: null, error }
  }
}

// Função para buscar usuário
export const findUser = async (username: string, email?: string) => {
  try {
    let query = supabase
      .from('users')
      .select('*')

    if (email) {
      query = query.or(`username.eq.${username},email.eq.${email}`)
    } else {
      query = query.eq('username', username)
    }

    const { data, error } = await query.single()

    if (error && error.code === 'PGRST116') {
      // Usuário não encontrado
      return { data: null, error: null }
    }

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return { data: null, error }
  }
}

// Função para atualizar último login
export const updateLastLogin = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    console.error('Erro ao atualizar último login:', error)
    return { error }
  }
}