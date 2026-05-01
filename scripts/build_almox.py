import re

with open('C:/gravidade/alicerce-crm/app/dashboard/components/modules/ComprasModule.tsx', encoding='utf-8') as f:
    src = f.read()

new = src

# Rename component
new = new.replace('export default function ComprasModule({ reducao }: { reducao: number })', 'export default function AlmoxarifadoPage()')
new = new.replace('ComprasModule', 'AlmoxarifadoPage')

# Tabs
new = new.replace('useState<"CATALOGO" | "TRACKING">("CATALOGO")', 'useState<"ESTOQUE" | "REQUISICOES" | "RECEBER" | "ENTREGA">("ESTOQUE")')
new = new.replace('activeTab === "CATALOGO"', 'activeTab === "ESTOQUE"')
new = new.replace('activeTab === "TRACKING"', 'activeTab === "REQUISICOES"')
new = new.replace('setActiveTab("CATALOGO")', 'setActiveTab("ESTOQUE")')
new = new.replace('setActiveTab("TRACKING")', 'setActiveTab("REQUISICOES")')

# Tab labels
new = new.replace('ShoppingBag size={16} /> Fazer Pedido', 'ShieldCheck size={16} /> Estoque EPI')
new = new.replace('Truck size={16} /> Acompanhamento', 'ClipboardList size={16} /> Requisições')

# Header
new = new.replace('Bem-vindo ao canal de compras Alicerce', 'Controle Central de Suprimentos e EPIs')
new = new.replace("'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite')\n      return `${saudacao}, Sr(a). ${user.name?.split(' ')[0] || 'Comprador'}!`", 
                  "'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'")

# Labels
new = new.replace('Portal de Compras', 'Almoxarifado')
new = new.replace("'Portal de Compras'", "'Almoxarifado'")
new = new.replace("'Comprador'", "'Almoxarife'")
new = new.replace('Comprador', 'Almoxarife')
new = new.replace('Catálogo de Produtos', 'Estoque de EPIs e Uniformes')
new = new.replace('O que você precisa?', 'Buscar EPI ou Uniforme...')
new = new.replace('Material / Descrição', 'EPI / Descrição')
new = new.replace('Cota Máxima', 'Saldo Atual')
new = new.replace('Volume Desejado', 'Qtd. Mínima')
new = new.replace('Enviar Pedido', 'Novo EPI')
new = new.replace('handleFinalizarPedido', 'handleNovoEPI')
new = new.replace('Histórico de Cada Item', 'Requisições em Andamento')
new = new.replace('Informativo do Mês', 'Estoque Crítico')
new = new.replace('canal de compras', 'gestão de almoxarifado')
new = new.replace('Sec. de Educação', 'Almoxarifado Central')
new = new.replace('Secretaria', 'Setor')

# Add ShieldCheck and ClipboardList to imports
new = new.replace(
    'Search, Truck, Package, Megaphone, Activity, ShoppingBag, \n  AlertTriangle, CheckCircle2, Send, Calendar, Filter, \n  ArrowRight, Box, Clock, ChevronRight, TrendingDown, History as HistoryIcon,\n  AlertCircle, FileText, UserCheck, Download, X',
    'Search, Truck, Package, Megaphone, Activity, ShoppingBag, ShieldCheck, ClipboardList,\n  AlertTriangle, CheckCircle2, Send, Calendar, Filter, Plus,\n  ArrowRight, Box, Clock, ChevronRight, TrendingDown, History as HistoryIcon,\n  AlertCircle, FileText, UserCheck, Download, X'
)

with open('C:/gravidade/alicerce-crm/app/dashboard/almoxarifado/page.tsx', 'w', encoding='utf-8') as f:
    f.write(new)

print('OK - chars:', len(new))
