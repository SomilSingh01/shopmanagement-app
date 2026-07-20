import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { ChevronLeft, Download, FileText, ChevronDown, ChevronUp, IndianRupee } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

interface InvoiceItem {
  name: string
  sku: string | null
  unit: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  customer: { name: string; email: string; phone: string | null }
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  status: string
  createdAt: string
  shop: { name: string; shopName: string | null; shopAddress: string | null; phone: string | null; email: string }
}

export default function InvoicesPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => apiClient.getInvoices(),
  })

  const invoices: Invoice[] = invoicesData?.data || invoicesData || []

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()

      // Header background
      doc.setFillColor(30, 41, 59)
      doc.rect(0, 0, pageWidth, 45, 'F')

      // Shop Name
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text(invoice.shop.shopName || invoice.shop.name || 'Shop Manager', 20, 22)

      // Invoice label
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(invoice.shop.shopAddress || '', 20, 32)
      doc.text(`Phone: ${invoice.shop.phone || 'N/A'}`, 20, 38)

      // Invoice Number & Date (right side)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('INVOICE', pageWidth - 20, 18, { align: 'right' })
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(invoice.invoiceNumber, pageWidth - 20, 26, { align: 'right' })
      doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, pageWidth - 20, 34, { align: 'right' })

      // Bill To section
      doc.setTextColor(100, 116, 139)
      doc.setFontSize(9)
      doc.text('BILL TO', 20, 58)

      doc.setTextColor(15, 23, 42)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(invoice.customer.name, 20, 66)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(invoice.customer.email || '', 20, 73)
      doc.text(invoice.customer.phone || '', 20, 79)

      // Status badge
      doc.setFillColor(22, 163, 74)
      doc.roundedRect(pageWidth - 50, 55, 30, 10, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(invoice.status, pageWidth - 35, 62, { align: 'center' })

      // Items Table
      const tableData = invoice.items.map((item, i) => [
        String(i + 1),
        item.name,
        item.sku || '-',
        String(item.quantity),
        `₹${item.unitPrice.toLocaleString('en-IN')}`,
        `₹${item.total.toLocaleString('en-IN')}`,
      ])

      autoTable(doc, {
        startY: 90,
        head: [['#', 'Item', 'SKU', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: [15, 23, 42] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 12 },
          4: { halign: 'right' },
          5: { halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 20, right: 20 },
      })

      // Summary section
      const finalY = (doc as any).lastAutoTable.finalY + 15
      const summaryX = pageWidth - 80

      doc.setDrawColor(226, 232, 240)
      doc.line(summaryX, finalY - 5, pageWidth - 20, finalY - 5)

      doc.setTextColor(100, 116, 139)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Subtotal:', summaryX, finalY + 2)
      doc.setTextColor(15, 23, 42)
      doc.text(`₹${invoice.subtotal.toLocaleString('en-IN')}`, pageWidth - 20, finalY + 2, { align: 'right' })

      doc.setTextColor(100, 116, 139)
      doc.text('Tax:', summaryX, finalY + 12)
      doc.setTextColor(15, 23, 42)
      doc.text(`₹${invoice.tax.toLocaleString('en-IN')}`, pageWidth - 20, finalY + 12, { align: 'right' })

      doc.setDrawColor(226, 232, 240)
      doc.line(summaryX, finalY + 18, pageWidth - 20, finalY + 18)

      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 64, 175)
      doc.text('Total:', summaryX, finalY + 28)
      doc.text(`₹${invoice.total.toLocaleString('en-IN')}`, pageWidth - 20, finalY + 28, { align: 'right' })

      // Footer
      doc.setTextColor(148, 163, 184)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Thank you for your business!', pageWidth / 2, finalY + 50, { align: 'center' })
      doc.text(`Generated by Shop Manager on ${new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, finalY + 56, { align: 'center' })

      doc.save(`${invoice.invoiceNumber}.pdf`)
      toast.success('Invoice downloaded!')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-20">
        <div className="px-4 py-4 flex items-center gap-3">
          <Link to="/app/settings">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Invoices</h1>
            <p className="text-xs text-muted-foreground">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} generated</p>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="px-4 py-4 space-y-3">
        {invoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No invoices yet</p>
            <p className="text-sm text-muted-foreground mt-1">Invoices are generated when orders are delivered.</p>
          </div>
        ) : (
          invoices.map((invoice) => {
            const isExpanded = expandedId === invoice.id
            return (
              <div
                key={invoice.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Invoice Header */}
                <button
                  onClick={() => toggleExpand(invoice.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-foreground text-sm truncate">{invoice.invoiceNumber}</h3>
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        {invoice.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">{invoice.customer.name}</p>
                      <p className="text-sm font-bold text-foreground">₹{invoice.total.toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-muted-foreground">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                        {/* Items */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Items</p>
                          {invoice.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5">
                              <div>
                                <p className="text-sm text-foreground">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.quantity} × ₹{item.unitPrice.toLocaleString()}</p>
                              </div>
                              <p className="text-sm font-semibold text-foreground">₹{item.total.toLocaleString()}</p>
                            </div>
                          ))}
                        </div>

                        {/* Summary */}
                        <div className="border-t border-border pt-2 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="text-foreground">₹{invoice.subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tax</span>
                            <span className="text-foreground">₹{invoice.tax.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold pt-1 border-t border-border">
                            <span className="text-foreground">Total</span>
                            <span className="text-primary">₹{invoice.total.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Download Button */}
                        <button
                          onClick={() => handleDownloadPdf(invoice)}
                          className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
