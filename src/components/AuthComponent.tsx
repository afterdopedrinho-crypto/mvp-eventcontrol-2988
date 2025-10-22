"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react'

interface AuthProps {
  onAuthSuccess: (user: any) => void
}

export default function AuthComponent({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleMasterLogin = async () => {
    if (formData.email === 'eventonasuamao2025' && formData.password === '@Oshp1920') {
      try {
        // Tentar criar usuário mestre se não existir
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', 'master@eventonasuamao.com')
          .single()

        if (!existingUser) {
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              {
                id: 'master-user-id',
                email: 'master@eventonasuamao.com',
                name: 'Usuário Mestre',
                is_master: true
              }
            ])

          if (insertError) {
            console.error('Erro ao criar usuário mestre:', insertError)
          }
        }
      } catch (error) {
        console.error('Erro ao criar usuário mestre:', error)
        // Continuar mesmo se houver erro - usar fallback
      }

      const masterUser = {
        id: 'master-user-id',
        email: 'master@eventonasuamao.com',
        name: 'Usuário Mestre',
        is_master: true
      }

      onAuthSuccess(masterUser)
      return true
    }
    return false
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Verificar se é login do usuário mestre
      if (await handleMasterLogin()) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos. Verifique suas credenciais.')
        } else {
          setError('Erro ao fazer login: ' + error.message)
        }
        setLoading(false)
        return
      }

      if (data.user) {
        // Buscar dados do usuário na tabela users
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (userError) {
            console.error('Erro ao buscar dados do usuário:', userError)
          }

          onAuthSuccess({
            id: data.user.id,
            email: data.user.email,
            name: userData?.name || data.user.email?.split('@')[0] || 'Usuário',
            is_master: userData?.is_master || false
          })
        } catch (err) {
          console.error('Erro ao buscar dados do usuário:', err)
          // Usar dados básicos se houver erro
          onAuthSuccess({
            id: data.user.id,
            email: data.user.email,
            name: data.user.email?.split('@')[0] || 'Usuário',
            is_master: false
          })
        }
      }
    } catch (err) {
      setError('Erro inesperado ao fazer login')
      console.error('Erro no login:', err)
    }

    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!formData.name.trim()) {
      setError('Nome é obrigatório')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name
          }
        }
      })

      if (error) {
        setError('Erro ao criar conta: ' + error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        try {
          // Inserir dados do usuário na tabela users
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                email: data.user.email,
                name: formData.name,
                is_master: false
              }
            ])

          if (insertError) {
            console.error('Erro ao salvar dados do usuário:', insertError)
          }

          // Criar dados iniciais do usuário
          const { error: dataError } = await supabase
            .from('user_data')
            .insert([
              {
                user_id: data.user.id,
                events: [],
                products: [],
                sales: [],
                expenses: [],
                expense_categories: [],
                revenues: [],
                notifications: [],
                templates: [],
                ticket_info: {
                  currentTicketPrice: 50,
                  ticketsSold: 0,
                  eventTotalCost: 15000
                }
              }
            ])

          if (dataError) {
            console.error('Erro ao criar dados iniciais:', dataError)
          }
        } catch (err) {
          console.error('Erro ao salvar dados:', err)
          // Continuar mesmo se houver erro - usar localStorage como fallback
        }

        setSuccess('Conta criada com sucesso! Verifique seu e-mail para confirmar.')
        setFormData({ email: '', password: '', name: '' })
        
        // Auto login após cadastro se não precisar de confirmação
        if (data.session) {
          onAuthSuccess({
            id: data.user.id,
            email: data.user.email,
            name: formData.name,
            is_master: false
          })
        }
      }
    } catch (err) {
      setError('Erro inesperado ao criar conta')
      console.error('Erro no cadastro:', err)
    }

    setLoading(false)
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Digite seu e-mail para recuperar a senha')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: window.location.origin + '/reset-password'
      })

      if (error) {
        setError('Erro ao enviar e-mail de recuperação: ' + error.message)
      } else {
        setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
      }
    } catch (err) {
      setError('Erro inesperado ao recuperar senha')
      console.error('Erro na recuperação:', err)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            EventControl Pro
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {/* Name Field (only for signup) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Seu nome completo"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isLogin ? 'E-mail ou Usuário' : 'E-mail'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={isLogin ? "text" : "email"}
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder={isLogin ? "seu@email.com ou eventonasuamao2025" : "seu@email.com"}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Sua senha"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Forgot Password */}
          {isLogin && (
            <button
              onClick={handleForgotPassword}
              disabled={loading}
              className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Esqueceu sua senha?
            </button>
          )}

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setSuccess('')
                setFormData({ email: '', password: '', name: '' })
              }}
              className="mt-2 text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              {isLogin ? (
                <>
                  Cadastrar-se
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  Fazer Login
                </>
              )}
            </button>
          </div>
        </div>

        {/* Master User Info */}
        {isLogin && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-800 text-sm text-center">
              <strong>Usuário Mestre:</strong> eventonasuamao2025 / @Oshp1920
            </p>
          </div>
        )}
      </div>
    </div>
  )
}