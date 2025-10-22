"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  MapPin, 
  Clock,
  BarChart3,
  PieChart,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Bell,
  Download,
  MessageSquare,
  Star,
  AlertTriangle,
  CheckCircle,
  Filter,
  Search,
  RefreshCw,
  Share2,
  Eye,
  EyeOff,
  Zap,
  Target,
  Award,
  Calculator,
  Camera,
  FileText,
  Settings,
  Moon,
  Sun,
  ShoppingCart,
  Coffee,
  Package,
  Receipt,
  Percent,
  Activity,
  Ticket,
  Slider,
  Undo,
  Redo,
  RotateCcw,
  History,
  TrendingRight,
  ArrowRight,
  Sparkles,
  LineChart,
  Flame,
  Crown,
  Rocket,
  Gem,
  Palette,
  Layers,
  Gauge,
  Play,
  FolderOpen
} from 'lucide-react'

interface Event {
  id: string
  name: string
  date: string
  location: string
  attendees: number
  budget: number
  status: 'active' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  description?: string
}

interface Product {
  id: string
  name: string
  category: 'bar' | 'loja'
  type: 'package' | 'unit'
  purchasePrice: number // Custo individual
  unitPrice: number
  packagePrice: number
  packageUnits: number
  salePrice: number
  quantity: number
  packageQuantity: number
  sold: number
  returnedPackages?: number
  remainingUnits?: number
}

interface Sale {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  total: number
  date: string
  category: 'bar' | 'loja'
}

interface Expense {
  id: string
  eventId: string
  description: string
  amount: number
  category: string
  date: string
  approved: boolean
}

interface ExpenseCategory {
  id: string
  name: string
  items: ExpenseItem[]
  expanded: boolean
}

interface ExpenseItem {
  id: string
  description: string
  amount: number
}

interface Revenue {
  id: string
  eventId: string
  description: string
  amount: number
  date: string
  category: string
}

interface Notification {
  id: string
  type: 'warning' | 'info' | 'success' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

interface EventTemplate {
  id: string
  name: string
  description: string
  estimatedBudget: number
  categories: string[]
  products: Partial<Product>[]
}

interface TicketInfo {
  currentTicketPrice: number
  ticketsSold: number
  eventTotalCost: number
  // Novos campos para períodos
  month1Sold: number
  month2Sold: number
  month3Sold: number
}

interface UndoAction {
  id: string
  type: 'delete_product' | 'add_product' | 'update_product'
  data: any
  timestamp: Date
  description: string
}

// Interface para eventos históricos
interface HistoricalEvent {
  id: string
  name: string
  date: string
  totalParticipants: number
  ticketPrice: number
  totalRevenue: number
  // Opção rápida ou detalhada para bar
  barMode: 'quick' | 'detailed'
  barTotalRevenue?: number // Para modo rápido
  barProducts?: HistoricalProduct[] // Para modo detalhado
  // Períodos de venda
  month3Sales: number
  month2Sales: number
  month1Sales: number
  finalSales: number
  eventCost: number
}

interface HistoricalProduct {
  name: string
  category: 'bar' | 'loja'
  sold: number
  price: number
  cost: number
}

export default function EventControlPro() {
  // Estados existentes
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ingressos' | 'bar' | 'loja' | 'relatorio' | 'historico'>('dashboard')
  const [darkMode, setDarkMode] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [calculatorValue, setCalculatorValue] = useState('')
  const [showFloatingMenu, setShowFloatingMenu] = useState(false)
  
  // Data states
  const [events, setEvents] = useState<Event[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [templates, setTemplates] = useState<EventTemplate[]>([])
  const [ticketInfo, setTicketInfo] = useState<TicketInfo>({
    currentTicketPrice: 0,
    ticketsSold: 0,
    eventTotalCost: 0,
    month1Sold: 0,
    month2Sold: 0,
    month3Sold: 0
  })
  
  // Estados para histórico
  const [historicalEvents, setHistoricalEvents] = useState<HistoricalEvent[]>([])
  const [showHistoricalForm, setShowHistoricalForm] = useState(false)
  const [newHistoricalEvent, setNewHistoricalEvent] = useState<Partial<HistoricalEvent>>({
    name: '',
    date: '',
    totalParticipants: 0,
    ticketPrice: 0,
    barMode: 'quick',
    barTotalRevenue: 0,
    barProducts: [],
    month3Sales: 0,
    month2Sales: 0,
    month1Sales: 0,
    finalSales: 0,
    eventCost: 0
  })
  
  // Undo/Redo functionality
  const [undoHistory, setUndoHistory] = useState<UndoAction[]>([])
  const [redoHistory, setRedoHistory] = useState<UndoAction[]>([])
  
  // UI states
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showCustomProductForm, setShowCustomProductForm] = useState(false)
  const [barLojaSlider, setBarLojaSlider] = useState(50)
  
  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'bar' as 'bar' | 'loja',
    type: 'package' as 'package' | 'unit',
    packagePrice: '',
    packageUnits: '',
    salePrice: '',
    packageQuantity: '',
    purchasePrice: '' // Novo campo para custo
  })
  
  const [newExpense, setNewExpense] = useState({
    eventId: '',
    description: '',
    amount: '',
    category: 'food'
  })

  // Função para formatar números com pontuação brasileira - CORRIGIDA
  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'R$ 0,00'
    }
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR')
  }

  // Função para zerar todos os dados - CORRIGIDA
  const resetAllData = () => {
    if (window.confirm('⚠️ ATENÇÃO: Esta ação irá zerar TODOS os dados do sistema (produtos, vendas, ingressos, despesas, histórico, etc.). Você tem certeza que deseja continuar?')) {
      try {
        // Zerar todos os estados
        setProducts([])
        setSales([])
        setExpenses([])
        setRevenues([])
        setTicketInfo({
          currentTicketPrice: 0,
          ticketsSold: 0,
          eventTotalCost: 0,
          month1Sold: 0,
          month2Sold: 0,
          month3Sold: 0
        })
        setExpenseCategories([
          {
            id: '1',
            name: 'Decoração',
            expanded: false,
            items: []
          },
          {
            id: '2',
            name: 'Marketing',
            expanded: false,
            items: []
          },
          {
            id: '3',
            name: 'Logística',
            expanded: false,
            items: []
          },
          {
            id: '4',
            name: 'Passagem Aérea',
            expanded: false,
            items: []
          },
          {
            id: '5',
            name: 'Artista',
            expanded: false,
            items: []
          },
          {
            id: '6',
            name: 'Hotel',
            expanded: false,
            items: []
          },
          {
            id: '7',
            name: 'Alimentação',
            expanded: false,
            items: []
          }
        ])
        setUndoHistory([])
        setRedoHistory([])
        setHistoricalEvents([])
        
        // Limpar localStorage
        const keysToRemove = [
          'eventcontrol-products',
          'eventcontrol-sales',
          'eventcontrol-expenses',
          'eventcontrol-revenues',
          'eventcontrol-ticketinfo',
          'eventcontrol-expensecategories',
          'eventcontrol-undohistory',
          'eventcontrol-historicalevents'
        ]
        
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key)
          } catch (error) {
            console.warn(`Erro ao remover ${key} do localStorage:`, error)
          }
        })
        
        addNotification('success', 'Sistema Zerado', 'Todos os dados foram zerados com sucesso! Agora você pode inserir os dados do seu evento.')
      } catch (error) {
        console.error('Erro ao zerar dados:', error)
        addNotification('error', 'Erro', 'Ocorreu um erro ao zerar os dados. Tente novamente.')
      }
    }
  }

  // Undo/Redo functions
  const addUndoAction = (action: Omit<UndoAction, 'id' | 'timestamp'>) => {
    const undoAction: UndoAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setUndoHistory(prev => [undoAction, ...prev.slice(0, 9)]) // Keep only last 10 actions
    setRedoHistory([]) // Clear redo history when new action is performed
  }

  const performUndo = () => {
    if (undoHistory.length === 0) return

    const action = undoHistory[0]
    setRedoHistory(prev => [action, ...prev])
    setUndoHistory(prev => prev.slice(1))

    switch (action.type) {
      case 'delete_product':
        // Restore deleted product
        setProducts(prev => [...prev, action.data])
        addNotification('success', 'Produto Restaurado', `${action.data.name} foi restaurado`)
        break
      case 'add_product':
        // Remove added product
        setProducts(prev => prev.filter(p => p.id !== action.data.id))
        addNotification('success', 'Adição Desfeita', `${action.data.name} foi removido`)
        break
      case 'update_product':
        // Restore previous product state
        setProducts(prev => prev.map(p => p.id === action.data.id ? action.data : p))
        addNotification('success', 'Alteração Desfeita', `${action.data.name} foi restaurado`)
        break
    }
  }

  const performRedo = () => {
    if (redoHistory.length === 0) return

    const action = redoHistory[0]
    setUndoHistory(prev => [action, ...prev])
    setRedoHistory(prev => prev.slice(1))

    switch (action.type) {
      case 'delete_product':
        // Delete product again
        setProducts(prev => prev.filter(p => p.id !== action.data.id))
        addNotification('success', 'Exclusão Refeita', `${action.data.name} foi excluído novamente`)
        break
      case 'add_product':
        // Add product again
        setProducts(prev => [...prev, action.data])
        addNotification('success', 'Adição Refeita', `${action.data.name} foi adicionado novamente`)
        break
      case 'update_product':
        // Apply update again
        setProducts(prev => prev.map(p => p.id === action.data.id ? action.data : p))
        addNotification('success', 'Alteração Refeita', `${action.data.name} foi alterado novamente`)
        break
    }
  }

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = {
      events: localStorage.getItem('eventcontrol-events'),
      products: localStorage.getItem('eventcontrol-products'),
      sales: localStorage.getItem('eventcontrol-sales'),
      expenses: localStorage.getItem('eventcontrol-expenses'),
      expenseCategories: localStorage.getItem('eventcontrol-expensecategories'),
      revenues: localStorage.getItem('eventcontrol-revenues'),
      notifications: localStorage.getItem('eventcontrol-notifications'),
      templates: localStorage.getItem('eventcontrol-templates'),
      ticketInfo: localStorage.getItem('eventcontrol-ticketinfo'),
      darkMode: localStorage.getItem('eventcontrol-darkmode'),
      undoHistory: localStorage.getItem('eventcontrol-undohistory'),
      historicalEvents: localStorage.getItem('eventcontrol-historicalevents')
    }

    if (savedData.events) setEvents(JSON.parse(savedData.events))
    if (savedData.products) setProducts(JSON.parse(savedData.products))
    if (savedData.sales) setSales(JSON.parse(savedData.sales))
    if (savedData.expenses) setExpenses(JSON.parse(savedData.expenses))
    if (savedData.expenseCategories) setExpenseCategories(JSON.parse(savedData.expenseCategories))
    if (savedData.revenues) setRevenues(JSON.parse(savedData.revenues))
    if (savedData.notifications) setNotifications(JSON.parse(savedData.notifications))
    if (savedData.templates) setTemplates(JSON.parse(savedData.templates))
    if (savedData.ticketInfo) setTicketInfo(JSON.parse(savedData.ticketInfo))
    if (savedData.darkMode) setDarkMode(JSON.parse(savedData.darkMode))
    if (savedData.undoHistory) setUndoHistory(JSON.parse(savedData.undoHistory))
    if (savedData.historicalEvents) setHistoricalEvents(JSON.parse(savedData.historicalEvents))
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('eventcontrol-events', JSON.stringify(events))
  }, [events])

  useEffect(() => {
    localStorage.setItem('eventcontrol-products', JSON.stringify(products))
  }, [products])

  useEffect(() => {
    localStorage.setItem('eventcontrol-sales', JSON.stringify(sales))
  }, [sales])

  useEffect(() => {
    localStorage.setItem('eventcontrol-expenses', JSON.stringify(expenses))
  }, [expenses])

  useEffect(() => {
    localStorage.setItem('eventcontrol-expensecategories', JSON.stringify(expenseCategories))
  }, [expenseCategories])

  useEffect(() => {
    localStorage.setItem('eventcontrol-revenues', JSON.stringify(revenues))
  }, [revenues])

  useEffect(() => {
    localStorage.setItem('eventcontrol-notifications', JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem('eventcontrol-templates', JSON.stringify(templates))
  }, [templates])

  useEffect(() => {
    localStorage.setItem('eventcontrol-ticketinfo', JSON.stringify(ticketInfo))
  }, [ticketInfo])

  useEffect(() => {
    localStorage.setItem('eventcontrol-darkmode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem('eventcontrol-undohistory', JSON.stringify(undoHistory))
  }, [undoHistory])

  useEffect(() => {
    localStorage.setItem('eventcontrol-historicalevents', JSON.stringify(historicalEvents))
  }, [historicalEvents])

  // Initialize with sample data if empty
  useEffect(() => {
    if (expenseCategories.length === 0) {
      const sampleExpenseCategories: ExpenseCategory[] = [
        {
          id: '1',
          name: 'Decoração',
          expanded: false,
          items: []
        },
        {
          id: '2',
          name: 'Marketing',
          expanded: false,
          items: []
        },
        {
          id: '3',
          name: 'Logística',
          expanded: false,
          items: []
        },
        {
          id: '4',
          name: 'Passagem Aérea',
          expanded: false,
          items: []
        },
        {
          id: '5',
          name: 'Artista',
          expanded: false,
          items: []
        },
        {
          id: '6',
          name: 'Hotel',
          expanded: false,
          items: []
        },
        {
          id: '7',
          name: 'Alimentação',
          expanded: false,
          items: []
        }
      ]

      setExpenseCategories(sampleExpenseCategories)
    }
  }, [expenseCategories.length])

  // Calculator functions
  const handleCalculatorInput = (value: string) => {
    if (value === '=') {
      try {
        const result = eval(calculatorValue)
        setCalculatorValue(result.toString())
      } catch {
        setCalculatorValue('Erro')
      }
    } else if (value === 'C') {
      setCalculatorValue('')
    } else if (value === '←') {
      setCalculatorValue(calculatorValue.slice(0, -1))
    } else {
      setCalculatorValue(calculatorValue + value)
    }
  }

  // Business logic functions
  const addProduct = () => {
    if (!newProduct.name || !newProduct.salePrice) return

    let product: Product

    if (newProduct.type === 'package') {
      if (!newProduct.packagePrice || !newProduct.packageUnits || !newProduct.packageQuantity) return

      const packagePrice = parseFloat(newProduct.packagePrice)
      const packageUnits = parseInt(newProduct.packageUnits)
      const packageQuantity = parseInt(newProduct.packageQuantity)
      const unitPrice = packagePrice / packageUnits
      const totalUnits = packageQuantity * packageUnits
      const purchasePrice = newProduct.purchasePrice ? parseFloat(newProduct.purchasePrice) : unitPrice

      product = {
        id: Date.now().toString(),
        name: newProduct.name,
        category: newProduct.category,
        type: 'package',
        purchasePrice: purchasePrice,
        unitPrice: unitPrice,
        packagePrice: packagePrice,
        packageUnits: packageUnits,
        salePrice: parseFloat(newProduct.salePrice),
        quantity: totalUnits,
        packageQuantity: packageQuantity,
        sold: 0,
        returnedPackages: 0,
        remainingUnits: 0
      }
    } else {
      if (!newProduct.packageQuantity) return

      const salePrice = parseFloat(newProduct.salePrice)
      const purchasePrice = newProduct.purchasePrice ? parseFloat(newProduct.purchasePrice) : salePrice * 0.6
      const quantity = parseInt(newProduct.packageQuantity)

      product = {
        id: Date.now().toString(),
        name: newProduct.name,
        category: newProduct.category,
        type: 'unit',
        purchasePrice: purchasePrice,
        unitPrice: purchasePrice,
        packagePrice: purchasePrice,
        packageUnits: 1,
        salePrice: salePrice,
        quantity: quantity,
        packageQuantity: quantity,
        sold: 0,
        returnedPackages: 0,
        remainingUnits: 0
      }
    }

    setProducts([...products, product])
    addUndoAction({
      type: 'add_product',
      data: product,
      description: `Produto ${product.name} adicionado`
    })
    
    setNewProduct({ 
      name: '', 
      category: 'bar', 
      type: 'package', 
      packagePrice: '', 
      packageUnits: '', 
      salePrice: '', 
      packageQuantity: '',
      purchasePrice: ''
    })
    setShowCustomProductForm(false)
    
    addNotification('success', 'Produto Adicionado', `${product.name} foi adicionado com sucesso`)
  }

  const deleteProduct = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    // Check if product has sales
    const productSales = sales.filter(s => s.productId === productId)
    if (productSales.length > 0) {
      addNotification('error', 'Não é possível excluir', 'Este produto possui vendas registradas')
      return
    }

    // Add to undo history before deleting
    addUndoAction({
      type: 'delete_product',
      data: product,
      description: `Produto ${product.name} excluído`
    })

    setProducts(products.filter(p => p.id !== productId))
    addNotification('success', 'Produto Excluído', `${product.name} foi excluído com sucesso`)
  }

  const updateProductSale = (productId: string, quantitySold: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    if (quantitySold > product.quantity) {
      addNotification('error', 'Estoque Insuficiente', 'Não há estoque suficiente para esta venda')
      return
    }

    // Store previous state for undo
    addUndoAction({
      type: 'update_product',
      data: product,
      description: `Venda de ${product.name} atualizada`
    })

    // Update product sold quantity
    setProducts(products.map(p => 
      p.id === productId 
        ? { ...p, sold: quantitySold }
        : p
    ))

    // Update or create sale record
    const existingSale = sales.find(s => s.productId === productId)
    if (existingSale) {
      setSales(sales.map(s => 
        s.productId === productId 
          ? { ...s, quantity: quantitySold, total: quantitySold * product.salePrice }
          : s
      ))
    } else if (quantitySold > 0) {
      const sale: Sale = {
        id: Date.now().toString(),
        productId,
        quantity: quantitySold,
        unitPrice: product.salePrice,
        total: quantitySold * product.salePrice,
        date: new Date().toISOString().split('T')[0],
        category: product.category
      }
      setSales([...sales, sale])
    }

    addNotification('success', 'Venda Atualizada', `Venda de ${product.name} atualizada com sucesso`)
  }

  const updateProductReturns = (productId: string, returnedPackages: number, remainingUnits: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    // Store previous state for undo
    addUndoAction({
      type: 'update_product',
      data: product,
      description: `Devoluções de ${product.name} atualizadas`
    })

    // Para produtos do bar, calcular vendas baseado em pacotes devolvidos
    if (product.category === 'bar' && product.type === 'package') {
      const packagesNotReturned = product.packageQuantity - (returnedPackages || 0)
      const unitsNotReturned = packagesNotReturned * product.packageUnits
      const unitsSold = unitsNotReturned - (remainingUnits || 0)
      
      // Atualizar vendas automaticamente
      setProducts(products.map(p => 
        p.id === productId 
          ? { ...p, sold: Math.max(0, unitsSold), returnedPackages: returnedPackages || 0, remainingUnits: remainingUnits || 0 }
          : p
      ))

      // Atualizar registro de venda
      const existingSale = sales.find(s => s.productId === productId)
      if (existingSale) {
        setSales(sales.map(s => 
          s.productId === productId 
            ? { ...s, quantity: Math.max(0, unitsSold), total: Math.max(0, unitsSold) * product.salePrice }
            : s
        ))
      } else if (unitsSold > 0) {
        const sale: Sale = {
          id: Date.now().toString(),
          productId,
          quantity: unitsSold,
          unitPrice: product.salePrice,
          total: unitsSold * product.salePrice,
          date: new Date().toISOString().split('T')[0],
          category: product.category
        }
        setSales([...sales, sale])
      }
    } else {
      // Para produtos da loja, calcular vendas baseado em quantidade devolvida
      const unitsSold = product.packageQuantity - (returnedPackages || 0)
      
      setProducts(products.map(p => 
        p.id === productId 
          ? { ...p, sold: Math.max(0, unitsSold), returnedPackages: returnedPackages || 0, remainingUnits: remainingUnits || 0 }
          : p
      ))

      // Atualizar registro de venda
      const existingSale = sales.find(s => s.productId === productId)
      if (existingSale) {
        setSales(sales.map(s => 
          s.productId === productId 
            ? { ...s, quantity: Math.max(0, unitsSold), total: Math.max(0, unitsSold) * product.salePrice }
            : s
        ))
      } else if (unitsSold > 0) {
        const sale: Sale = {
          id: Date.now().toString(),
          productId,
          quantity: unitsSold,
          unitPrice: product.salePrice,
          total: unitsSold * product.salePrice,
          date: new Date().toISOString().split('T')[0],
          category: product.category
        }
        setSales([...sales, sale])
      }
    }
  }

  const addExpenseItem = (categoryId: string, description: string, amount: number) => {
    if (!description || amount <= 0) return

    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      description,
      amount
    }

    setExpenseCategories(expenseCategories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, items: [...cat.items, newItem] }
        : cat
    ))

    addNotification('success', 'Despesa Adicionada', `${description} foi adicionada com sucesso`)
  }

  const removeExpenseItem = (categoryId: string, itemId: string) => {
    setExpenseCategories(expenseCategories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
        : cat
    ))
  }

  const toggleExpenseCategory = (categoryId: string) => {
    setExpenseCategories(expenseCategories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, expanded: !cat.expanded }
        : cat
    ))
  }

  const addNotification = (type: Notification['type'], title: string, message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false
    }
    setNotifications(prev => [notification, ...prev])
  }

  const exportToPDF = async () => {
    setIsExporting(true)
    
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const reportData = {
      summary: {
        totalRevenue: getTotalRevenue(),
        totalExpenses: getTotalExpenses(),
        netProfit: getNetProfit(),
        barRevenue: getBarRevenue(),
        lojaRevenue: getLojaRevenue()
      },
      products,
      sales,
      expenses,
      revenues,
      historicalEvents,
      generatedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eventcontrol-relatorio-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setIsExporting(false)
    addNotification('success', 'Relatório Exportado', 'Relatório foi exportado com sucesso!')
  }

  // Calculation functions
  const getTotalRevenue = () => {
    return sales.reduce((sum, sale) => sum + sale.total, 0) + 
           revenues.reduce((sum, rev) => sum + rev.amount, 0) +
           (ticketInfo.currentTicketPrice * ticketInfo.ticketsSold)
  }

  const getTotalExpenses = () => {
    const productCosts = products.reduce((sum, product) => {
      const packagesNotReturned = product.packageQuantity - (product.returnedPackages || 0)
      return sum + (product.packagePrice * packagesNotReturned)
    }, 0)

    const categoriesExpenses = expenseCategories.reduce((sum, category) => {
      return sum + category.items.reduce((catSum, item) => catSum + item.amount, 0)
    }, 0)

    return expenses.reduce((sum, exp) => sum + exp.amount, 0) + productCosts + categoriesExpenses + ticketInfo.eventTotalCost
  }

  const getNetProfit = () => {
    return getTotalRevenue() - getTotalExpenses()
  }

  const getBarRevenue = () => {
    return sales.filter(s => s.category === 'bar').reduce((sum, sale) => sum + sale.total, 0)
  }

  const getLojaRevenue = () => {
    return sales.filter(s => s.category === 'loja').reduce((sum, sale) => sum + sale.total, 0)
  }

  const getBarInvestment = () => {
    return products.filter(p => p.category === 'bar').reduce((sum, p) => {
      const packagesNotReturned = p.packageQuantity - (p.returnedPackages || 0)
      return sum + (p.packagePrice * packagesNotReturned)
    }, 0)
  }

  const getLojaInvestment = () => {
    return products.filter(p => p.category === 'loja').reduce((sum, p) => {
      const packagesNotReturned = p.packageQuantity - (p.returnedPackages || 0)
      return sum + (p.packagePrice * packagesNotReturned)
    }, 0)
  }

  const getBarProfit = () => {
    return getBarRevenue() - getBarInvestment()
  }

  const getLojaProfit = () => {
    return getLojaRevenue() - getLojaInvestment()
  }

  const getBarMargin = () => {
    const revenue = getBarRevenue()
    return revenue > 0 ? ((getBarProfit() / revenue) * 100) : 0
  }

  const getLojaMargin = () => {
    const revenue = getLojaRevenue()
    return revenue > 0 ? ((getLojaProfit() / revenue) * 100) : 0
  }

  // Função para calcular lucro líquido individual da cerveja
  const getBeerProfit = () => {
    const beerProducts = products.filter(p => 
      p.category === 'bar' && 
      (p.name.toLowerCase().includes('cerveja') || 
       p.name.toLowerCase().includes('beer') ||
       p.name.toLowerCase().includes('heineken') ||
       p.name.toLowerCase().includes('skol') ||
       p.name.toLowerCase().includes('brahma'))
    )
    
    return beerProducts.reduce((sum, product) => {
      const revenue = product.sold * product.salePrice
      const cost = product.sold * product.purchasePrice
      return sum + (revenue - cost)
    }, 0)
  }

  // Funções para histórico
  const addHistoricalEvent = () => {
    if (!newHistoricalEvent.name || !newHistoricalEvent.totalParticipants || !newHistoricalEvent.ticketPrice) {
      addNotification('error', 'Dados Incompletos', 'Preencha pelo menos nome, participantes e preço do ingresso')
      return
    }

    const historicalEvent: HistoricalEvent = {
      id: Date.now().toString(),
      name: newHistoricalEvent.name || '',
      date: newHistoricalEvent.date || '',
      totalParticipants: newHistoricalEvent.totalParticipants || 0,
      ticketPrice: newHistoricalEvent.ticketPrice || 0,
      totalRevenue: (newHistoricalEvent.totalParticipants || 0) * (newHistoricalEvent.ticketPrice || 0) + 
                   (newHistoricalEvent.barTotalRevenue || 0),
      barMode: newHistoricalEvent.barMode || 'quick',
      barTotalRevenue: newHistoricalEvent.barTotalRevenue,
      barProducts: newHistoricalEvent.barProducts || [],
      month3Sales: newHistoricalEvent.month3Sales || 0,
      month2Sales: newHistoricalEvent.month2Sales || 0,
      month1Sales: newHistoricalEvent.month1Sales || 0,
      finalSales: newHistoricalEvent.finalSales || 0,
      eventCost: newHistoricalEvent.eventCost || 0
    }

    setHistoricalEvents([...historicalEvents, historicalEvent])
    setNewHistoricalEvent({
      name: '',
      date: '',
      totalParticipants: 0,
      ticketPrice: 0,
      barMode: 'quick',
      barTotalRevenue: 0,
      barProducts: [],
      month3Sales: 0,
      month2Sales: 0,
      month1Sales: 0,
      finalSales: 0,
      eventCost: 0
    })
    setShowHistoricalForm(false)
    
    addNotification('success', 'Evento Histórico Adicionado', `${historicalEvent.name} foi adicionado ao histórico`)
  }

  const deleteHistoricalEvent = (eventId: string) => {
    setHistoricalEvents(historicalEvents.filter(e => e.id !== eventId))
    addNotification('success', 'Evento Removido', 'Evento histórico foi removido')
  }

  // Função para validar data
  const validateDate = (day: string, month: string, year: string) => {
    const dayNum = parseInt(day)
    const monthNum = parseInt(month)
    const yearNum = parseInt(year)
    
    if (dayNum < 1 || dayNum > 31) return false
    if (monthNum < 1 || monthNum > 12) return false
    if (year.length !== 4) return false
    
    return true
  }

  const themeClasses = darkMode ? 'dark bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'

  return (
    <div className={`min-h-screen transition-all duration-500 ${themeClasses} relative overflow-hidden`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 relative z-10">
        {/* Header - Enhanced with animations */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 gap-4">
          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg animate-pulse">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent animate-gradient`}>
                  EventControl Pro
                </h1>
              </div>
            </div>
            <p className={`text-sm sm:text-lg mt-1 sm:mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'} flex items-center gap-2`}>
              <Sparkles className="w-4 h-4 text-purple-500" />
              Gestão Completa de Eventos com Analytics Avançados e Comparativos Históricos
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            {/* Enhanced Action Buttons */}
            <button
              onClick={resetAllData}
              className="group p-2 sm:p-3 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:via-pink-600 hover:to-red-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              title="Zerar todos os dados para inserir dados do seu evento"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-300" />
            </button>
            
            <button
              onClick={performUndo}
              disabled={undoHistory.length === 0}
              className={`group p-2 sm:p-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${
                undoHistory.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 text-white hover:from-yellow-600 hover:via-orange-600 hover:to-yellow-700'
              }`}
              title="Desfazer"
            >
              <Undo className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            </button>
            
            <button
              onClick={performRedo}
              disabled={redoHistory.length === 0}
              className={`group p-2 sm:p-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${
                redoHistory.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white hover:from-orange-600 hover:via-red-600 hover:to-orange-700'
              }`}
              title="Refazer"
            >
              <Redo className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`group p-2 sm:p-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${
                darkMode 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
              }`}
            >
              {darkMode ? 
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-500" /> : 
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
              }
            </button>
            
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="group p-2 sm:p-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:via-teal-600 hover:to-emerald-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="group p-2 sm:p-3 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl relative"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-bounce" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold animate-pulse">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-2xl p-2 shadow-2xl mb-4 sm:mb-8 border border-white/20`}>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3, gradient: 'from-blue-500 to-cyan-600' },
              { id: 'ingressos', label: 'Ingressos', icon: Ticket, gradient: 'from-indigo-500 to-purple-600' },
              { id: 'bar', label: 'Bar', icon: Coffee, gradient: 'from-orange-500 to-red-600' },
              { id: 'loja', label: 'Loja', icon: ShoppingCart, gradient: 'from-pink-500 to-rose-600' },
              { id: 'relatorio', label: 'Relatório', icon: FileText, gradient: 'from-emerald-500 to-teal-600' },
              { id: 'historico', label: 'Histórico', icon: History, gradient: 'from-purple-500 to-pink-600' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm hover:scale-105 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105`
                    : darkMode
                    ? 'text-gray-300 hover:bg-gray-700/50'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <tab.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${activeTab === tab.id ? 'animate-pulse' : 'group-hover:scale-110'} transition-transform duration-300`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab - Enhanced */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-8">
            {/* Enhanced Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className={`group ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl p-3 sm:p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-emerald-200/20`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${darkMode ? 'text-emerald-400' : 'text-emerald-600'} font-medium flex items-center gap-1 sm:gap-2 text-xs sm:text-sm`}>
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 group-hover:animate-bounce" />
                      Receita Total
                    </p>
                    <p className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-800'} group-hover:scale-110 transition-transform duration-300`}>
                      {formatCurrency(getTotalRevenue())}
                    </p>
                  </div>
                  <div className={`${darkMode ? 'bg-emerald-900/50' : 'bg-emerald-200/50'} p-2 sm:p-3 rounded-full group-hover:rotate-12 transition-transform duration-300`}>
                    <TrendingUp className={`w-4 h-4 sm:w-6 sm:h-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`} />
                  </div>
                </div>
              </div>

              <div className={`group ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl p-3 sm:p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-pink-200/20`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${darkMode ? 'text-pink-400' : 'text-pink-600'} font-medium flex items-center gap-1 sm:gap-2 text-xs sm:text-sm`}>
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 group-hover:animate-bounce" />
                      Investimento
                    </p>
                    <p className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-pink-300' : 'text-pink-800'} group-hover:scale-110 transition-transform duration-300`}>
                      {formatCurrency(getTotalExpenses())}
                    </p>
                  </div>
                  <div className={`${darkMode ? 'bg-pink-900/50' : 'bg-pink-200/50'} p-2 sm:p-3 rounded-full group-hover:rotate-12 transition-transform duration-300`}>
                    <TrendingDown className={`w-4 h-4 sm:w-6 sm:h-6 ${darkMode ? 'text-pink-400' : 'text-pink-700'}`} />
                  </div>
                </div>
              </div>

              <div className={`group ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl p-3 sm:p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border ${getNetProfit() >= 0 ? 'border-cyan-200/20' : 'border-red-200/20'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${darkMode ? (getNetProfit() >= 0 ? 'text-cyan-400' : 'text-red-400') : (getNetProfit() >= 0 ? 'text-cyan-600' : 'text-red-600')} font-medium flex items-center gap-1 sm:gap-2 text-xs sm:text-sm`}>
                      <Target className="w-3 h-3 sm:w-4 sm:h-4 group-hover:animate-spin" />
                      {getNetProfit() >= 0 ? 'Lucro' : 'Falta Pagar'}
                    </p>
                    <p className={`text-lg sm:text-2xl font-bold ${getNetProfit() >= 0 ? (darkMode ? 'text-cyan-300' : 'text-cyan-800') : 'text-red-600'} group-hover:scale-110 transition-transform duration-300`}>
                      {formatCurrency(Math.abs(getNetProfit()))}
                    </p>
                  </div>
                  <div className={`${darkMode ? (getNetProfit() >= 0 ? 'bg-cyan-900/50' : 'bg-red-900/50') : (getNetProfit() >= 0 ? 'bg-cyan-200/50' : 'bg-red-200/50')} p-2 sm:p-3 rounded-full group-hover:scale-110 transition-transform duration-300`}>
                    <DollarSign className={`w-4 h-4 sm:w-6 sm:h-6 ${darkMode ? (getNetProfit() >= 0 ? 'text-cyan-400' : 'text-red-400') : (getNetProfit() >= 0 ? 'text-cyan-700' : 'text-red-700')}`} />
                  </div>
                </div>
              </div>

              <div className={`group ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl p-3 sm:p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-violet-200/20`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${darkMode ? 'text-violet-400' : 'text-violet-600'} font-medium flex items-center gap-1 sm:gap-2 text-xs sm:text-sm`}>
                      <Ticket className="w-3 h-3 sm:w-4 sm:h-4 group-hover:animate-pulse" />
                      Ingressos
                    </p>
                    <p className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-violet-300' : 'text-violet-800'} group-hover:scale-110 transition-transform duration-300`}>
                      {formatNumber(ticketInfo.ticketsSold)}
                    </p>
                  </div>
                  <div className={`${darkMode ? 'bg-violet-900/50' : 'bg-violet-200/50'} p-2 sm:p-3 rounded-full group-hover:rotate-12 transition-transform duration-300`}>
                    <Ticket className={`w-4 h-4 sm:w-6 sm:h-6 ${darkMode ? 'text-violet-400' : 'text-violet-700'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico Comparativo de Ingressos dos Últimos 3 Meses - NOVO */}
            <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20`}>
              <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3 sm:mb-4 flex items-center gap-2`}>
                <LineChart className="w-5 h-5 text-blue-500 animate-pulse" />
                Comparativo de Vendas de Ingressos por Período
              </h3>
              
              <div className="space-y-4">
                {/* Evento Atual */}
                <div className={`${darkMode ? 'bg-blue-900/30' : 'bg-blue-50/50'} p-4 rounded-xl border-l-4 border-blue-500`}>
                  <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Evento Atual
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-blue-600 font-medium">3º Mês Atrás</div>
                      <div className="text-2xl font-bold text-blue-700">{formatNumber(ticketInfo.month3Sold)}</div>
                      <div className="text-xs text-blue-600">ingressos vendidos</div>
                      <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min((ticketInfo.month3Sold / Math.max(ticketInfo.ticketsSold, 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-600 font-medium">2º Mês Atrás</div>
                      <div className="text-2xl font-bold text-blue-700">{formatNumber(ticketInfo.month2Sold)}</div>
                      <div className="text-xs text-blue-600">ingressos vendidos</div>
                      <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min((ticketInfo.month2Sold / Math.max(ticketInfo.ticketsSold, 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-600 font-medium">1º Mês Atrás</div>
                      <div className="text-2xl font-bold text-blue-700">{formatNumber(ticketInfo.month1Sold)}</div>
                      <div className="text-xs text-blue-600">ingressos vendidos</div>
                      <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min((ticketInfo.month1Sold / Math.max(ticketInfo.ticketsSold, 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-600 font-medium">Total Atual</div>
                      <div className="text-2xl font-bold text-blue-700">{formatNumber(ticketInfo.ticketsSold)}</div>
                      <div className="text-xs text-blue-600">ingressos vendidos</div>
                      <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full w-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Receita por Período */}
                  <div className="mt-4 pt-4 border-t border-blue-200/50">
                    <h5 className="font-medium text-blue-600 mb-2">Receita por Período</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-blue-600 font-medium">3º Mês</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(ticketInfo.month3Sold * ticketInfo.currentTicketPrice)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-600 font-medium">2º Mês</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(ticketInfo.month2Sold * ticketInfo.currentTicketPrice)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-600 font-medium">1º Mês</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(ticketInfo.month1Sold * ticketInfo.currentTicketPrice)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-600 font-medium">Total</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(ticketInfo.ticketsSold * ticketInfo.currentTicketPrice)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Eventos Históricos para Comparação */}
                {historicalEvents.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mt-6 mb-4">
                      <History className="w-5 h-5 text-gray-500" />
                      <h4 className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Comparação com Eventos Anteriores
                      </h4>
                    </div>
                    
                    {historicalEvents.slice(0, 3).map((event, index) => (
                      <div key={event.id} className={`${darkMode ? 'bg-gray-700/30' : 'bg-gray-50/50'} p-4 rounded-xl border-l-4 border-gray-400`}>
                        <h4 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {event.name} ({event.date})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-gray-600 font-medium">3º Mês</div>
                            <div className="text-xl font-bold text-gray-700">{formatNumber(event.month3Sales)}</div>
                            <div className="text-xs text-gray-600">ingressos</div>
                            {ticketInfo.month3Sold > 0 && (
                              <div className={`text-xs font-medium mt-1 ${event.month3Sales > ticketInfo.month3Sold ? 'text-red-600' : 'text-green-600'}`}>
                                {event.month3Sales > ticketInfo.month3Sold ? '↓' : '↑'} 
                                {Math.abs(((ticketInfo.month3Sold - event.month3Sales) / Math.max(event.month3Sales, 1) * 100)).toFixed(1)}%
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600 font-medium">2º Mês</div>
                            <div className="text-xl font-bold text-gray-700">{formatNumber(event.month2Sales)}</div>
                            <div className="text-xs text-gray-600">ingressos</div>
                            {ticketInfo.month2Sold > 0 && (
                              <div className={`text-xs font-medium mt-1 ${event.month2Sales > ticketInfo.month2Sold ? 'text-red-600' : 'text-green-600'}`}>
                                {event.month2Sales > ticketInfo.month2Sold ? '↓' : '↑'} 
                                {Math.abs(((ticketInfo.month2Sold - event.month2Sales) / Math.max(event.month2Sales, 1) * 100)).toFixed(1)}%
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600 font-medium">1º Mês</div>
                            <div className="text-xl font-bold text-gray-700">{formatNumber(event.month1Sales)}</div>
                            <div className="text-xs text-gray-600">ingressos</div>
                            {ticketInfo.month1Sold > 0 && (
                              <div className={`text-xs font-medium mt-1 ${event.month1Sales > ticketInfo.month1Sold ? 'text-red-600' : 'text-green-600'}`}>
                                {event.month1Sales > ticketInfo.month1Sold ? '↓' : '↑'} 
                                {Math.abs(((ticketInfo.month1Sold - event.month1Sales) / Math.max(event.month1Sales, 1) * 100)).toFixed(1)}%
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600 font-medium">Final</div>
                            <div className="text-xl font-bold text-gray-700">{formatNumber(event.finalSales)}</div>
                            <div className="text-xs text-gray-600">ingressos</div>
                            {ticketInfo.ticketsSold > 0 && (
                              <div className={`text-xs font-medium mt-1 ${event.finalSales > ticketInfo.ticketsSold ? 'text-red-600' : 'text-green-600'}`}>
                                {event.finalSales > ticketInfo.ticketsSold ? '↓' : '↑'} 
                                {Math.abs(((ticketInfo.ticketsSold - event.finalSales) / Math.max(event.finalSales, 1) * 100)).toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Receita Comparativa */}
                        <div className="mt-3 pt-3 border-t border-gray-200/50">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Receita Total do Evento:</span>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(event.finalSales * event.ticketPrice)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-gray-600">Ticket Médio:</span>
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(event.ticketPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {/* Insights e Tendências */}
                {(ticketInfo.month1Sold > 0 || ticketInfo.month2Sold > 0 || ticketInfo.month3Sold > 0) && (
                  <div className={`${darkMode ? 'bg-purple-900/30' : 'bg-purple-50/50'} p-4 rounded-xl border-l-4 border-purple-500`}>
                    <h4 className="font-semibold text-purple-600 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Insights e Tendências
                    </h4>
                    <div className="space-y-2 text-sm">
                      {ticketInfo.month1Sold > ticketInfo.month2Sold && (
                        <div className="flex items-center gap-2 text-green-600">
                          <ArrowRight className="w-4 h-4" />
                          <span>Aceleração nas vendas no último mês (+{((ticketInfo.month1Sold - ticketInfo.month2Sold) / Math.max(ticketInfo.month2Sold, 1) * 100).toFixed(1)}%)</span>
                        </div>
                      )}
                      {ticketInfo.month2Sold > ticketInfo.month3Sold && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <ArrowRight className="w-4 h-4" />
                          <span>Crescimento consistente entre 3º e 2º mês (+{((ticketInfo.month2Sold - ticketInfo.month3Sold) / Math.max(ticketInfo.month3Sold, 1) * 100).toFixed(1)}%)</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-purple-600">
                        <Target className="w-4 h-4" />
                        <span>
                          Ritmo médio: {Math.round((ticketInfo.month1Sold + ticketInfo.month2Sold + ticketInfo.month3Sold) / 3)} ingressos/mês
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Quick Actions */}
            <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20`}>
              <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3 sm:mb-4 flex items-center gap-2`}>
                <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
                Ações Rápidas
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-4">
                {[
                  { tab: 'historico', icon: History, label: 'Histórico', gradient: 'from-cyan-500 to-blue-600' },
                  { tab: 'ingressos', icon: Ticket, label: 'Ingressos', gradient: 'from-indigo-500 to-purple-600' },
                  { tab: 'bar', icon: Coffee, label: 'Bar', gradient: 'from-orange-500 to-red-600' },
                  { tab: 'loja', icon: ShoppingCart, label: 'Loja', gradient: 'from-purple-500 to-pink-600' },
                  { tab: 'relatorio', icon: FileText, label: 'Relatórios', gradient: 'from-blue-500 to-cyan-600' },
                  { action: 'export', icon: Download, label: 'Exportar', gradient: 'from-green-500 to-emerald-600' }
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (item.action === 'export') {
                        exportToPDF()
                      } else {
                        setActiveTab(item.tab as any)
                      }
                    }}
                    disabled={item.action === 'export' && isExporting}
                    className={`group p-3 sm:p-4 bg-gradient-to-r ${item.gradient} text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex flex-col items-center gap-1 sm:gap-2 disabled:opacity-50`}
                  >
                    {item.action === 'export' && isExporting ? 
                      <RefreshCw className="w-4 h-4 sm:w-6 sm:h-6 animate-spin" /> : 
                      <item.icon className="w-4 h-4 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform duration-300" />
                    }
                    <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20`}>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
                  <Gauge className="w-5 h-5 text-blue-500" />
                  Performance do Bar
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Receita</span>
                    <span className="font-bold text-orange-600">{formatCurrency(getBarRevenue())}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Margem</span>
                    <span className="font-bold text-blue-600">{getBarMargin().toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(getBarMargin(), 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20`}>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
                  <Crown className="w-5 h-5 text-purple-500" />
                  Performance da Loja
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Receita</span>
                    <span className="font-bold text-purple-600">{formatCurrency(getLojaRevenue())}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Margem</span>
                    <span className="font-bold text-blue-600">{getLojaMargin().toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(getLojaMargin(), 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Lucro da Cerveja */}
              <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20`}>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
                  <Coffee className="w-5 h-5 text-amber-500" />
                  Lucro da Cerveja
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Lucro Líquido</span>
                    <span className="font-bold text-amber-600">{formatCurrency(getBeerProfit())}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>% do Bar</span>
                    <span className="font-bold text-blue-600">
                      {getBarProfit() > 0 ? ((getBeerProfit() / getBarProfit()) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(getBarProfit() > 0 ? (getBeerProfit() / getBarProfit()) * 100 : 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ingressos Tab - CORRIGIDA com períodos */}
        {activeTab === 'ingressos' && (
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20`}>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6 flex items-center gap-2`}>
                <Ticket className="w-8 h-8 text-indigo-600" />
                Gestão de Ingressos
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="group">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    Ticket Médio do Ingresso (R$)
                  </label>
                  <input
                    type="number"
                    value={ticketInfo.currentTicketPrice || ''}
                    onChange={(e) => setTicketInfo({ ...ticketInfo, currentTicketPrice: parseFloat(e.target.value) || 0 })}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-300 group-hover:shadow-lg ${
                      darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200'
                    }`}
                    placeholder="0"
                  />
                </div>
                
                <div className="group">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    Ingressos Vendidos
                  </label>
                  <input
                    type="number"
                    value={ticketInfo.ticketsSold || ''}
                    onChange={(e) => setTicketInfo({ ...ticketInfo, ticketsSold: parseInt(e.target.value) || 0 })}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-300 group-hover:shadow-lg ${
                      darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200'
                    }`}
                    placeholder="0"
                  />
                </div>
                
                <div className="group">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    Custo Total do Evento (R$)
                  </label>
                  <input
                    type="number"
                    value={ticketInfo.eventTotalCost || ''}
                    onChange={(e) => setTicketInfo({ ...ticketInfo, eventTotalCost: parseFloat(e.target.value) || 0 })}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-300 group-hover:shadow-lg ${
                      darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200'
                    }`}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Vendas por Período */}
              <div className="mb-8">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
                  Vendas por Período (para comparativo)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="group">
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      Ingressos Vendidos - 3º Mês
                    </label>
                    <input
                      type="number"
                      value={ticketInfo.month3Sold || ''}
                      onChange={(e) => setTicketInfo({ ...ticketInfo, month3Sold: parseInt(e.target.value) || 0 })}
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-300 group-hover:shadow-lg ${
                        darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200'
                      }`}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="group">
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      Ingressos Vendidos - 2º Mês
                    </label>
                    <input
                      type="number"
                      value={ticketInfo.month2Sold || ''}
                      onChange={(e) => setTicketInfo({ ...ticketInfo, month2Sold: parseInt(e.target.value) || 0 })}
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-300 group-hover:shadow-lg ${
                        darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200'
                      }`}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="group">
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      Ingressos Vendidos - 1º Mês
                    </label>
                    <input
                      type="number"
                      value={ticketInfo.month1Sold || ''}
                      onChange={(e) => setTicketInfo({ ...ticketInfo, month1Sold: parseInt(e.target.value) || 0 })}
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-300 group-hover:shadow-lg ${
                        darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200'
                      }`}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Métricas de Ingressos */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className={`${darkMode ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/50' : 'bg-gradient-to-br from-indigo-50 to-purple-50'} p-4 rounded-xl border border-indigo-200/50`}>
                  <h4 className="font-semibold text-indigo-600 mb-2">Receita de Ingressos</h4>
                  <p className="text-2xl font-bold text-indigo-700">{formatCurrency(ticketInfo.currentTicketPrice * ticketInfo.ticketsSold)}</p>
                </div>
                
                <div className={`${darkMode ? 'bg-gradient-to-br from-green-900/50 to-emerald-900/50' : 'bg-gradient-to-br from-green-50 to-emerald-50'} p-4 rounded-xl border border-green-200/50`}>
                  <h4 className="font-semibold text-green-600 mb-2">Ingressos para Quitar</h4>
                  <p className="text-2xl font-bold text-green-700">
                    {ticketInfo.currentTicketPrice > 0 ? Math.ceil(ticketInfo.eventTotalCost / ticketInfo.currentTicketPrice) : 0}
                  </p>
                </div>
                
                <div className={`${darkMode ? 'bg-gradient-to-br from-orange-900/50 to-red-900/50' : 'bg-gradient-to-br from-orange-50 to-red-50'} p-4 rounded-xl border border-orange-200/50`}>
                  <h4 className="font-semibold text-orange-600 mb-2">Faltam Vender</h4>
                  <p className="text-2xl font-bold text-orange-700">
                    {Math.max(0, (ticketInfo.currentTicketPrice > 0 ? Math.ceil(ticketInfo.eventTotalCost / ticketInfo.currentTicketPrice) : 0) - ticketInfo.ticketsSold)}
                  </p>
                </div>
                
                <div className={`${darkMode ? 'bg-gradient-to-br from-blue-900/50 to-cyan-900/50' : 'bg-gradient-to-br from-blue-50 to-cyan-50'} p-4 rounded-xl border border-blue-200/50`}>
                  <h4 className="font-semibold text-blue-600 mb-2">% do Evento Pago</h4>
                  <p className="text-2xl font-bold text-blue-700">
                    {ticketInfo.eventTotalCost > 0 ? ((ticketInfo.currentTicketPrice * ticketInfo.ticketsSold) / ticketInfo.eventTotalCost * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Progresso do Evento</span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {ticketInfo.eventTotalCost > 0 ? ((ticketInfo.currentTicketPrice * ticketInfo.ticketsSold) / ticketInfo.eventTotalCost * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.min(ticketInfo.eventTotalCost > 0 ? (ticketInfo.currentTicketPrice * ticketInfo.ticketsSold) / ticketInfo.eventTotalCost * 100 : 0, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Simulação de Cenários */}
              <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'} p-4 rounded-xl`}>
                <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Simulação de Cenários</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-orange-600 font-semibold">Cenário Conservador (70%)</div>
                    <div className="text-xl font-bold text-orange-700">
                      {formatCurrency((ticketInfo.currentTicketPrice * ticketInfo.ticketsSold * 1.7) - ticketInfo.eventTotalCost)}
                    </div>
                    <div className="text-sm text-orange-600">lucro estimado</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-600 font-semibold">Cenário Realista (100%)</div>
                    <div className="text-xl font-bold text-blue-700">
                      {formatCurrency((ticketInfo.currentTicketPrice * ticketInfo.ticketsSold * 2) - ticketInfo.eventTotalCost)}
                    </div>
                    <div className="text-sm text-blue-600">lucro estimado</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-600 font-semibold">Cenário Otimista (150%)</div>
                    <div className="text-xl font-bold text-green-700">
                      {formatCurrency((ticketInfo.currentTicketPrice * ticketInfo.ticketsSold * 2.5) - ticketInfo.eventTotalCost)}
                    </div>
                    <div className="text-sm text-green-600">lucro estimado</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bar Tab - CORRIGIDA com quantidade automática */}
        {activeTab === 'bar' && (
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                  <Coffee className="w-8 h-8 text-orange-600" />
                  Gestão do Bar
                </h2>
                <button
                  onClick={() => setShowCustomProductForm(true)}
                  className="group px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  Adicionar Produto
                </button>
              </div>

              {/* Resumo do Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className={`${darkMode ? 'bg-gradient-to-br from-orange-900/50 to-red-900/50' : 'bg-gradient-to-br from-orange-50 to-red-50'} p-4 rounded-xl border border-orange-200/50`}>
                  <h4 className="font-semibold text-orange-600 mb-2">Receita do Bar</h4>
                  <p className="text-2xl font-bold text-orange-700">{formatCurrency(getBarRevenue())}</p>
                </div>
                
                <div className={`${darkMode ? 'bg-gradient-to-br from-pink-900/50 to-red-900/50' : 'bg-gradient-to-br from-pink-50 to-red-50'} p-4 rounded-xl border border-pink-200/50`}>
                  <h4 className="font-semibold text-pink-600 mb-2">Investimento</h4>
                  <p className="text-2xl font-bold text-pink-700">{formatCurrency(getBarInvestment())}</p>
                </div>
                
                <div className={`${darkMode ? 'bg-gradient-to-br from-green-900/50 to-emerald-900/50' : 'bg-gradient-to-br from-green-50 to-emerald-50'} p-4 rounded-xl border border-green-200/50`}>
                  <h4 className="font-semibold text-green-600 mb-2">Lucro</h4>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(getBarProfit())}</p>
                </div>
                
                <div className={`${darkMode ? 'bg-gradient-to-br from-blue-900/50 to-cyan-900/50' : 'bg-gradient-to-br from-blue-50 to-cyan-50'} p-4 rounded-xl border border-blue-200/50`}>
                  <h4 className="font-semibold text-blue-600 mb-2">Margem</h4>
                  <p className="text-2xl font-bold text-blue-700">{getBarMargin().toFixed(1)}%</p>
                </div>
              </div>

              {/* Lista de Produtos do Bar */}
              <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Produtos do Bar</h3>
                {products.filter(p => p.category === 'bar').length === 0 ? (
                  <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'} p-8 rounded-xl text-center`}>
                    <Coffee className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                      Nenhum produto do bar cadastrado ainda
                    </p>
                    <button
                      onClick={() => setShowCustomProductForm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Adicionar Primeiro Produto
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.filter(p => p.category === 'bar').map((product) => (
                      <div key={product.id} className={`${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} p-4 rounded-xl border border-orange-200/50 hover:shadow-lg transition-all duration-300`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{product.name}</h4>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-1 text-red-500 hover:bg-red-100 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Preço de Venda:</span>
                            <span className="font-medium text-orange-600">{formatCurrency(product.salePrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Estoque:</span>
                            <span className="font-medium">
                              {product.type === 'package' ? `${product.packageQuantity} pacotes` : `${product.quantity} unidades`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Vendidos:</span>
                            <span className="font-medium text-green-600">{product.sold} unidades</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Receita:</span>
                            <span className="font-medium text-blue-600">{formatCurrency(product.sold * product.salePrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Lucro Individual:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency((product.salePrice - product.purchasePrice) * product.sold)}
                            </span>
                          </div>
                        </div>

                        {/* Controles de Venda - Quantidade automática */}
                        <div className="mt-4 space-y-2">
                          {product.type === 'package' && (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={`block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
                                  Pacotes Devolvidos
                                </label>
                                <input
                                  type="number"
                                  value={product.returnedPackages || ''}
                                  onChange={(e) => updateProductReturns(product.id, parseInt(e.target.value) || 0, product.remainingUnits || 0)}
                                  className={`w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none ${
                                    darkMode ? 'bg-gray-600/50 border-gray-500 text-white' : 'bg-white/50 border-gray-200'
                                  }`}
                                  max={product.packageQuantity}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className={`block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
                                  Unidades Restantes
                                </label>
                                <input
                                  type="number"
                                  value={product.remainingUnits || ''}
                                  onChange={(e) => updateProductReturns(product.id, product.returnedPackages || 0, parseInt(e.target.value) || 0)}
                                  className={`w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none ${
                                    darkMode ? 'bg-gray-600/50 border-gray-500 text-white' : 'bg-white/50 border-gray-200'
                                  }`}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          )}
                          
                          {product.type === 'unit' && (
                            <div>
                              <label className={`block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
                                Produtos Devolvidos
                              </label>
                              <input
                                type="number"
                                value={product.returnedPackages || ''}
                                onChange={(e) => updateProductReturns(product.id, parseInt(e.target.value) || 0, 0)}
                                className={`w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none ${
                                  darkMode ? 'bg-gray-600/50 border-gray-500 text-white' : 'bg-white/50 border-gray-200'
                                }`}
                                max={product.packageQuantity}
                                placeholder="0"
                              />
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 italic">
                            * Quantidade vendida é calculada automaticamente
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loja Tab - CORRIGIDA com quantidade automática */}
        {activeTab === 'loja' && (
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                  <ShoppingCart className="w-8 h-8 text-purple-600" />
                  Gestão da Loja
                </h2>
                <button
                  onClick={() => setShowCustomProductForm(true)}
                  className="group px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  Adicionar Produto
                </button>
              </div>

              {/* Resumo da Loja */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50' : 'bg-gradient-to-br from-purple-50 to-pink-50'} p-4 rounded-xl border border-purple-200/50`}>
                  <h4 className="font-semibold text-purple-600 mb-2">Receita da Loja</h4>
                  <p className="text-2xl font-bold text-purple-700">{formatCurrency(getLojaRevenue())}</p>
                </div>
                
                <div className={`${darkMode ? 'bg-gradient-to-br from-pink-900/50 to-red-900/50' : 'bg-gradient-to-br from-pink-50 to-red-50'} p-4 rounded-xl border border-pink-200/50`}>
                  <h4 className="font-semibold text-pink-600 mb-2">Investimento</h4>
                  <p className="text-2xl font-bold text-pink-700">{formatCurrency(getLojaInvestment())}</p>
                </div>
                
                <div className={`${darkMode ? 'bg-gradient-to-br from-green-900/50 to-emerald-900/50' : 'bg-gradient-to-br from-green-50 to-emerald-50'} p-4 rounded-xl border border-green-200/50`}>
                  <h4 className="font-semibold text-green-600 mb-2">Lucro</h4>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(getLojaProfit())}</p>
                </div>
                
                <div className={`${darkMode ? 'bg-gradient-to-br from-blue-900/50 to-cyan-900/50' : 'bg-gradient-to-br from-blue-50 to-cyan-50'} p-4 rounded-xl border border-blue-200/50`}>
                  <h4 className="font-semibold text-blue-600 mb-2">Margem</h4>
                  <p className="text-2xl font-bold text-blue-700">{getLojaMargin().toFixed(1)}%</p>
                </div>
              </div>

              {/* Lista de Produtos da Loja */}
              <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Produtos da Loja</h3>
                {products.filter(p => p.category === 'loja').length === 0 ? (
                  <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'} p-8 rounded-xl text-center`}>
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                      Nenhum produto da loja cadastrado ainda
                    </p>
                    <button
                      onClick={() => setShowCustomProductForm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Adicionar Primeiro Produto
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.filter(p => p.category === 'loja').map((product) => (
                      <div key={product.id} className={`${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} p-4 rounded-xl border border-purple-200/50 hover:shadow-lg transition-all duration-300`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{product.name}</h4>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-1 text-red-500 hover:bg-red-100 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Preço de Venda:</span>
                            <span className="font-medium text-purple-600">{formatCurrency(product.salePrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Estoque:</span>
                            <span className="font-medium">{product.quantity} unidades</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Vendidos:</span>
                            <span className="font-medium text-green-600">{product.sold} unidades</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Receita:</span>
                            <span className="font-medium text-blue-600">{formatCurrency(product.sold * product.salePrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Lucro Individual:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency((product.salePrice - product.purchasePrice) * product.sold)}
                            </span>
                          </div>
                        </div>

                        {/* Controles de Venda - Quantidade automática */}
                        <div className="mt-4 space-y-2">
                          <div>
                            <label className={`block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
                              Produtos Devolvidos
                            </label>
                            <input
                              type="number"
                              value={product.returnedPackages || ''}
                              onChange={(e) => updateProductReturns(product.id, parseInt(e.target.value) || 0, 0)}
                              className={`w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${
                                darkMode ? 'bg-gray-600/50 border-gray-500 text-white' : 'bg-white/50 border-gray-200'
                              }`}
                              max={product.packageQuantity}
                              placeholder="0"
                            />
                          </div>
                          
                          <div className="text-xs text-gray-500 italic">
                            * Quantidade vendida é calculada automaticamente
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Relatório Tab - CORRIGIDA */}
        {activeTab === 'relatorio' && (
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                  <FileText className="w-8 h-8 text-emerald-600" />
                  Relatório Financeiro
                </h2>
                <button
                  onClick={exportToPDF}
                  disabled={isExporting}
                  className="group px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50"
                >
                  {isExporting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-300" />
                  )}
                  {isExporting ? 'Exportando...' : 'Exportar Relatório'}
                </button>
              </div>

              {/* Resumo Financeiro Geral */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className={`${darkMode ? 'bg-gradient-to-br from-green-900/50 to-emerald-900/50' : 'bg-gradient-to-br from-green-50 to-emerald-50'} p-4 rounded-xl border border-green-200/50`}>
                  <h4 className="font-semibold text-green-600 mb-2">Receita Total</h4>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(getTotalRevenue())}</p>
                  <p className="text-sm text-green-600">Ingressos + Bar + Loja</p>
                </div>
                
                <div className={`${darkMode ? 'bg-gradient-to-br from-red-900/50 to-pink-900/50' : 'bg-gradient-to-br from-red-50 to-pink-50'} p-4 rounded-xl border border-red-200/50`}>
                  <h4 className="font-semibold text-red-600 mb-2">Investimento Total</h4>
                  <p className="text-2xl font-bold text-red-700">{formatCurrency(getTotalExpenses())}</p>
                  <p className="text-sm text-red-600">Produtos + Despesas + Evento</p>
                </div>
                
                <div className={`${darkMode ? 'bg-gradient-to-br from-blue-900/50 to-cyan-900/50' : 'bg-gradient-to-br from-blue-50 to-cyan-50'} p-4 rounded-xl border ${getNetProfit() >= 0 ? 'border-blue-200/50' : 'border-red-200/50'}`}>
                  <h4 className={`font-semibold mb-2 ${getNetProfit() >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {getNetProfit() >= 0 ? 'Lucro Líquido' : 'Prejuízo'}
                  </h4>
                  <p className={`text-2xl font-bold ${getNetProfit() >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {formatCurrency(Math.abs(getNetProfit()))}
                  </p>
                  <p className={`text-sm ${getNetProfit() >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {getNetProfit() >= 0 ? 'Evento lucrativo' : 'Falta arrecadar'}
                  </p>
                </div>
                
                <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900/50 to-indigo-900/50' : 'bg-gradient-to-br from-purple-50 to-indigo-50'} p-4 rounded-xl border border-purple-200/50`}>
                  <h4 className="font-semibold text-purple-600 mb-2">Margem Geral</h4>
                  <p className="text-2xl font-bold text-purple-700">
                    {getTotalRevenue() > 0 ? ((getNetProfit() / getTotalRevenue()) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-sm text-purple-600">Eficiência do evento</p>
                </div>
              </div>

              {/* Detalhamento por Categoria */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Bar */}
                <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} p-6 rounded-xl border border-orange-200/50`}>
                  <h3 className="text-lg font-semibold text-orange-600 mb-4 flex items-center gap-2">
                    <Coffee className="w-5 h-5" />
                    Performance do Bar
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Receita Bruta:</span>
                      <span className="font-semibold text-orange-600">{formatCurrency(getBarRevenue())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Investimento:</span>
                      <span className="font-semibold text-red-600">{formatCurrency(getBarInvestment())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Lucro Líquido:</span>
                      <span className={`font-semibold ${getBarProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(getBarProfit())}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Lucro da Cerveja:</span>
                      <span className="font-semibold text-amber-600">{formatCurrency(getBeerProfit())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Margem:</span>
                      <span className="font-semibold text-blue-600">{getBarMargin().toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(Math.max(getBarMargin(), 0), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Loja */}
                <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} p-6 rounded-xl border border-purple-200/50`}>
                  <h3 className="text-lg font-semibold text-purple-600 mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Performance da Loja
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Receita Bruta:</span>
                      <span className="font-semibold text-purple-600">{formatCurrency(getLojaRevenue())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Investimento:</span>
                      <span className="font-semibold text-red-600">{formatCurrency(getLojaInvestment())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Lucro Líquido:</span>
                      <span className={`font-semibold ${getLojaProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(getLojaProfit())}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Margem:</span>
                      <span className="font-semibold text-blue-600">{getLojaMargin().toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(Math.max(getLojaMargin(), 0), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalhamento de Ingressos */}
              <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} p-6 rounded-xl border border-indigo-200/50 mb-6`}>
                <h3 className="text-lg font-semibold text-indigo-600 mb-4 flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Performance dos Ingressos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-indigo-600 font-semibold">Ticket Médio</div>
                    <div className="text-xl font-bold text-indigo-700">{formatCurrency(ticketInfo.currentTicketPrice)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-indigo-600 font-semibold">Ingressos Vendidos</div>
                    <div className="text-xl font-bold text-indigo-700">{formatNumber(ticketInfo.ticketsSold)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-indigo-600 font-semibold">Receita de Ingressos</div>
                    <div className="text-xl font-bold text-indigo-700">{formatCurrency(ticketInfo.currentTicketPrice * ticketInfo.ticketsSold)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-indigo-600 font-semibold">% do Evento Pago</div>
                    <div className="text-xl font-bold text-indigo-700">
                      {ticketInfo.eventTotalCost > 0 ? ((ticketInfo.currentTicketPrice * ticketInfo.ticketsSold) / ticketInfo.eventTotalCost * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Despesas por Categoria */}
              <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} p-6 rounded-xl border border-gray-200/50`}>
                <h3 className="text-lg font-semibold text-gray-600 mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Despesas por Categoria
                </h3>
                <div className="space-y-3">
                  {expenseCategories.map((category) => {
                    const categoryTotal = category.items.reduce((sum, item) => sum + item.amount, 0)
                    if (categoryTotal === 0) return null
                    
                    return (
                      <div key={category.id} className="flex justify-between items-center">
                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{category.name}:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(categoryTotal)}</span>
                      </div>
                    )
                  })}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center font-semibold">
                      <span className={`${darkMode ? 'text-white' : 'text-gray-800'}`}>Total de Despesas:</span>
                      <span className="text-red-600">
                        {formatCurrency(expenseCategories.reduce((sum, cat) => 
                          sum + cat.items.reduce((catSum, item) => catSum + item.amount, 0), 0
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Análise de Produtos Mais Vendidos */}
              {products.length > 0 && (
                <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} p-6 rounded-xl border border-gray-200/50`}>
                  <h3 className="text-lg font-semibold text-gray-600 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Top Produtos por Receita
                  </h3>
                  <div className="space-y-3">
                    {products
                      .sort((a, b) => (b.sold * b.salePrice) - (a.sold * a.salePrice))
                      .slice(0, 5)
                      .map((product, index) => (
                        <div key={product.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                              index === 2 ? 'bg-orange-500 text-white' :
                              'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </span>
                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {product.name} ({product.category})
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              {formatCurrency(product.sold * product.salePrice)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.sold} vendidos
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Histórico Tab - NOVA */}
        {activeTab === 'historico' && (
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                  <History className="w-8 h-8 text-purple-600" />
                  Base de Dados Histórica
                </h2>
                <button
                  onClick={() => setShowHistoricalForm(true)}
                  className="group px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  Adicionar Evento
                </button>
              </div>

              {/* Lista de Eventos Históricos */}
              <div className="space-y-4">
                {historicalEvents.length === 0 ? (
                  <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'} p-8 rounded-xl text-center`}>
                    <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                      Nenhum evento histórico cadastrado ainda
                    </p>
                    <button
                      onClick={() => setShowHistoricalForm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Adicionar Primeiro Evento
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {historicalEvents.map((event) => (
                      <div key={event.id} className={`${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} p-6 rounded-xl border border-purple-200/50 hover:shadow-lg transition-all duration-300`}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {event.name}
                            </h3>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {event.date} • {formatNumber(event.totalParticipants)} participantes
                            </p>
                          </div>
                          <button
                            onClick={() => deleteHistoricalEvent(event.id)}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-purple-600 font-semibold">Ticket Médio</div>
                            <div className="text-xl font-bold text-purple-700">{formatCurrency(event.ticketPrice)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-blue-600 font-semibold">Receita Total</div>
                            <div className="text-xl font-bold text-blue-700">{formatCurrency(event.totalRevenue)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-600 font-semibold">Custo do Evento</div>
                            <div className="text-xl font-bold text-green-700">{formatCurrency(event.eventCost)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-orange-600 font-semibold">Lucro</div>
                            <div className="text-xl font-bold text-orange-700">
                              {formatCurrency(event.totalRevenue - event.eventCost)}
                            </div>
                          </div>
                        </div>

                        {/* Vendas por Período */}
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-gray-600 font-medium">3º Mês</div>
                            <div className="text-lg font-bold text-gray-700">{formatNumber(event.month3Sales)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600 font-medium">2º Mês</div>
                            <div className="text-lg font-bold text-gray-700">{formatNumber(event.month2Sales)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600 font-medium">1º Mês</div>
                            <div className="text-lg font-bold text-gray-700">{formatNumber(event.month1Sales)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600 font-medium">Final</div>
                            <div className="text-lg font-bold text-gray-700">{formatNumber(event.finalSales)}</div>
                          </div>
                        </div>

                        {/* Informações do Bar */}
                        <div className="mt-4 pt-4 border-t border-gray-200/50">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Bar ({event.barMode === 'quick' ? 'Conta Rápida' : 'Detalhado'}):
                            </span>
                            <span className="font-semibold text-orange-600">
                              {event.barMode === 'quick' 
                                ? formatCurrency(event.barTotalRevenue || 0)
                                : formatCurrency(event.barProducts?.reduce((sum, p) => sum + (p.sold * p.price), 0) || 0)
                              }
                            </span>
                          </div>
                          {event.barMode === 'quick' && event.barTotalRevenue && (
                            <div className="text-xs text-gray-500 mt-1">
                              Ticket médio por pessoa: {formatCurrency((event.barTotalRevenue || 0) / event.totalParticipants)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Adicionar Produto - CORRIGIDO com placeholders */}
        {showCustomProductForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-xl rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Adicionar Produto
                </h3>
                <button
                  onClick={() => setShowCustomProductForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    Nome do Produto
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                      darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                    }`}
                    placeholder="Ex: Cerveja Heineken"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    Categoria
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as 'bar' | 'loja' })}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                      darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200'
                    }`}
                  >
                    <option value="bar">Bar</option>
                    <option value="loja">Loja</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    Tipo de Produto
                  </label>
                  <select
                    value={newProduct.type}
                    onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value as 'package' | 'unit' })}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                      darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200'
                    }`}
                  >
                    <option value="package">Pacote (ex: caixa com 24 unidades)</option>
                    <option value="unit">Unidade (ex: camiseta individual)</option>
                  </select>
                </div>

                {newProduct.type === 'package' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                          Preço do Pacote (R$)
                        </label>
                        <input
                          type="number"
                          value={newProduct.packagePrice}
                          onChange={(e) => setNewProduct({ ...newProduct, packagePrice: e.target.value })}
                          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                            darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                          }`}
                          placeholder="60"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                          Unidades por Pacote
                        </label>
                        <input
                          type="number"
                          value={newProduct.packageUnits}
                          onChange={(e) => setNewProduct({ ...newProduct, packageUnits: e.target.value })}
                          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                            darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                          }`}
                          placeholder="24"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      Preço de Venda (R$)
                    </label>
                    <input
                      type="number"
                      value={newProduct.salePrice}
                      onChange={(e) => setNewProduct({ ...newProduct, salePrice: e.target.value })}
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                        darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                      }`}
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      {newProduct.type === 'package' ? 'Quantidade de Pacotes' : 'Quantidade'}
                    </label>
                    <input
                      type="number"
                      value={newProduct.packageQuantity}
                      onChange={(e) => setNewProduct({ ...newProduct, packageQuantity: e.target.value })}
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                        darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                      }`}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    Custo Unitário (R$) - Opcional
                  </label>
                  <input
                    type="number"
                    value={newProduct.purchasePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, purchasePrice: e.target.value })}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                      darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                    }`}
                    placeholder="2.5"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCustomProductForm(false)}
                  className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={addProduct}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Adicionar Evento Histórico - NOVO */}
        {showHistoricalForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-xl rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Adicionar Evento Histórico
                </h3>
                <button
                  onClick={() => setShowHistoricalForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      Nome do Evento
                    </label>
                    <input
                      type="text"
                      value={newHistoricalEvent.name || ''}
                      onChange={(e) => setNewHistoricalEvent({ ...newHistoricalEvent, name: e.target.value })}
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                        darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                      }`}
                      placeholder="Festival de Verão 2023"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      Data do Evento
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Dia"
                        min="1"
                        max="31"
                        className={`p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                          darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                        }`}
                        onChange={(e) => {
                          const currentDate = newHistoricalEvent.date || ''
                          const parts = currentDate.split('/')
                          const day = e.target.value.padStart(2, '0')
                          const month = parts[1] || '01'
                          const year = parts[2] || new Date().getFullYear().toString()
                          setNewHistoricalEvent({ ...newHistoricalEvent, date: `${day}/${month}/${year}` })
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Mês"
                        min="1"
                        max="12"
                        className={`p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                          darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                        }`}
                        onChange={(e) => {
                          const currentDate = newHistoricalEvent.date || ''
                          const parts = currentDate.split('/')
                          const day = parts[0] || '01'
                          const month = e.target.value.padStart(2, '0')
                          const year = parts[2] || new Date().getFullYear().toString()
                          setNewHistoricalEvent({ ...newHistoricalEvent, date: `${day}/${month}/${year}` })
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Ano"
                        min="2000"
                        max="2030"
                        className={`p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                          darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                        }`}
                        onChange={(e) => {
                          if (e.target.value.length <= 4) {
                            const currentDate = newHistoricalEvent.date || ''
                            const parts = currentDate.split('/')
                            const day = parts[0] || '01'
                            const month = parts[1] || '01'
                            const year = e.target.value
                            setNewHistoricalEvent({ ...newHistoricalEvent, date: `${day}/${month}/${year}` })
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      Total de Participantes
                    </label>
                    <input
                      type="number"
                      value={newHistoricalEvent.totalParticipants || ''}
                      onChange={(e) => setNewHistoricalEvent({ ...newHistoricalEvent, totalParticipants: parseInt(e.target.value) || 0 })}
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                        darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                      }`}
                      placeholder="500"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      Ticket Médio do Ingresso (R$)
                    </label>
                    <input
                      type="number"
                      value={newHistoricalEvent.ticketPrice || ''}
                      onChange={(e) => setNewHistoricalEvent({ ...newHistoricalEvent, ticketPrice: parseFloat(e.target.value) || 0 })}
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                        darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                      }`}
                      placeholder="80"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      Custo do Evento (R$)
                    </label>
                    <input
                      type="number"
                      value={newHistoricalEvent.eventCost || ''}
                      onChange={(e) => setNewHistoricalEvent({ ...newHistoricalEvent, eventCost: parseFloat(e.target.value) || 0 })}
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                        darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                      }`}
                      placeholder="30000"
                    />
                  </div>
                </div>

                {/* Vendas por Período */}
                <div>
                  <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
                    Vendas de Ingressos por Período
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                        3º Mês
                      </label>
                      <input
                        type="number"
                        value={newHistoricalEvent.month3Sales || ''}
                        onChange={(e) => setNewHistoricalEvent({ ...newHistoricalEvent, month3Sales: parseInt(e.target.value) || 0 })}
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                          darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                        }`}
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                        2º Mês
                      </label>
                      <input
                        type="number"
                        value={newHistoricalEvent.month2Sales || ''}
                        onChange={(e) => setNewHistoricalEvent({ ...newHistoricalEvent, month2Sales: parseInt(e.target.value) || 0 })}
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                          darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                        }`}
                        placeholder="150"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                        1º Mês
                      </label>
                      <input
                        type="number"
                        value={newHistoricalEvent.month1Sales || ''}
                        onChange={(e) => setNewHistoricalEvent({ ...newHistoricalEvent, month1Sales: parseInt(e.target.value) || 0 })}
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                          darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                        }`}
                        placeholder="300"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                        Vendas Finais
                      </label>
                      <input
                        type="number"
                        value={newHistoricalEvent.finalSales || ''}
                        onChange={(e) => setNewHistoricalEvent({ ...newHistoricalEvent, finalSales: parseInt(e.target.value) || 0 })}
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                          darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                        }`}
                        placeholder="500"
                      />
                    </div>
                  </div>
                </div>

                {/* Métricas do Bar */}
                <div>
                  <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
                    Métricas do Bar
                  </h4>
                  
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      Tipo de Conta
                    </label>
                    <select
                      value={newHistoricalEvent.barMode || 'quick'}
                      onChange={(e) => setNewHistoricalEvent({ ...newHistoricalEvent, barMode: e.target.value as 'quick' | 'detailed' })}
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                        darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200'
                      }`}
                    >
                      <option value="quick">Conta Rápida (Faturamento Total)</option>
                      <option value="detailed">Conta Detalhada (Item por Item)</option>
                    </select>
                  </div>

                  {newHistoricalEvent.barMode === 'quick' && (
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                        Faturamento Total do Bar (R$)
                      </label>
                      <input
                        type="number"
                        value={newHistoricalEvent.barTotalRevenue || ''}
                        onChange={(e) => setNewHistoricalEvent({ ...newHistoricalEvent, barTotalRevenue: parseFloat(e.target.value) || 0 })}
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                          darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-200 placeholder-gray-500'
                        }`}
                        placeholder="15000"
                      />
                      {newHistoricalEvent.barTotalRevenue && newHistoricalEvent.totalParticipants && (
                        <p className="text-xs text-gray-500 mt-1">
                          Ticket médio por pessoa: {formatCurrency((newHistoricalEvent.barTotalRevenue || 0) / (newHistoricalEvent.totalParticipants || 1))}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowHistoricalForm(false)}
                  className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={addHistoricalEvent}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300"
                >
                  Adicionar Evento
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Floating Action Button */}
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
          <div className="relative">
            {showFloatingMenu && (
              <div className="absolute bottom-12 sm:bottom-16 right-0 space-y-2">
                {[
                  { tab: 'historico', icon: History, color: 'from-purple-500 to-pink-600', label: 'Adicionar Histórico' },
                  { tab: 'bar', icon: Coffee, color: 'from-orange-500 to-red-600', label: 'Adicionar ao Bar' },
                  { tab: 'loja', icon: ShoppingCart, color: 'from-purple-500 to-pink-600', label: 'Adicionar à Loja' },
                  { tab: 'ingressos', icon: Ticket, color: 'from-indigo-500 to-purple-600', label: 'Gerenciar Ingressos' },
                  { action: 'camera', icon: Camera, color: 'from-blue-500 to-indigo-600', label: 'Fotografar Nota Fiscal' }
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (item.action === 'camera') {
                        addNotification('info', 'Câmera', 'Funcionalidade de câmera será implementada em breve!')
                      } else if (item.tab === 'historico') {
                        setActiveTab('historico')
                        setShowHistoricalForm(true)
                      } else {
                        setActiveTab(item.tab as any)
                        if (item.tab === 'bar' || item.tab === 'loja') {
                          setShowCustomProductForm(true)
                        }
                      }
                      setShowFloatingMenu(false)
                    }}
                    className={`block p-2 sm:p-3 bg-gradient-to-r ${item.color} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-fade-in-up`}
                    title={item.label}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                ))}
              </div>
            )}
            
            <button
              onClick={() => setShowFloatingMenu(!showFloatingMenu)}
              className={`p-3 sm:p-4 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 ${
                showFloatingMenu ? 'rotate-45' : 'hover:rotate-12'
              }`}
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Enhanced Calculator Modal */}
        {showCalculator && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-xl rounded-2xl p-4 sm:p-6 w-full max-w-sm shadow-2xl border border-white/20`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                  <Calculator className="w-5 h-5 text-emerald-500" />
                  Calculadora
                </h3>
                <button
                  onClick={() => setShowCalculator(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'} p-3 sm:p-4 rounded-xl mb-4 backdrop-blur-sm`}>
                <div className={`text-right text-xl sm:text-2xl font-mono ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {calculatorValue || '0'}
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {['C', '←', '/', '*', '7', '8', '9', '-', '4', '5', '6', '+', '1', '2', '3', '=', '0', '.'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => handleCalculatorInput(btn)}
                    className={`p-2 sm:p-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base hover:scale-105 ${
                      btn === '=' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white col-span-2 shadow-lg' 
                        : btn === '0'
                        ? 'col-span-2 bg-gray-200 hover:bg-gray-300 text-gray-800 shadow-md'
                        : darkMode
                        ? 'bg-gray-700/50 hover:bg-gray-600/50 text-white shadow-md'
                        : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-800 shadow-md'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Notifications Dropdown */}
        {showNotifications && (
          <div className="fixed top-16 sm:top-20 right-2 sm:right-4 w-80 max-w-[calc(100vw-1rem)] bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-50 max-h-96 overflow-y-auto">
            <div className="p-3 sm:p-4 border-b border-gray-200/50">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-500" />
                Notificações
              </h3>
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                  <Bell className="w-6 h-6 text-gray-400" />
                </div>
                Nenhuma notificação
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 sm:p-4 border-b border-gray-100/50 hover:bg-gray-50/50 cursor-pointer transition-all duration-200 ${!notification.read ? 'bg-blue-50/50' : ''}`}
                    onClick={() => {
                      setNotifications(notifications.map(n => 
                        n.id === notification.id ? { ...n, read: true } : n
                      ))
                    }}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`p-1 rounded-full ${
                        notification.type === 'success' ? 'bg-green-100' :
                        notification.type === 'warning' ? 'bg-yellow-100' :
                        notification.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {notification.type === 'success' && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />}
                        {notification.type === 'warning' && <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />}
                        {notification.type === 'error' && <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />}
                        {notification.type === 'info' && <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 text-xs sm:text-sm">{notification.title}</h4>
                        <p className="text-gray-600 text-xs mt-1">{notification.message}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {notification.timestamp.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}