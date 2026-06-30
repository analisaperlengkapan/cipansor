import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class InvoiceListScreen extends StatefulWidget {
  const InvoiceListScreen({super.key});

  @override
  State<InvoiceListScreen> createState() => _InvoiceListScreenState();
}

class _InvoiceListScreenState extends State<InvoiceListScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

  // Mock data - In real app, fetch from API
  final List<Map<String, dynamic>> _invoices = [
    {
      'id': '1',
      'invoiceNumber': 'INV-202501-0001',
      'paymentType': {'name': 'SPP Januari 2025'},
      'amount': 950000,
      'status': 'PENDING',
      'dueDate': '2025-01-10',
    },
    {
      'id': '2',
      'invoiceNumber': 'INV-202412-0054',
      'paymentType': {'name': 'SPP Desember 2024'},
      'amount': 950000,
      'status': 'PAID',
      'dueDate': '2024-12-10',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tagihan SPP'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _invoices.length,
        itemBuilder: (context, index) {
          final invoice = _invoices[index];
          final bool isPaid = invoice['status'] == 'PAID';

          return Card(
            margin: const EdgeInsets.bottom(16),
            child: ListTile(
              title: Text(invoice['paymentType']['name']),
              subtitle: Text('Jatuh Tempo: ${invoice['dueDate']}'),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    currencyFormat.format(invoice['amount']),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: isPaid ? Colors.green : Colors.orange,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      invoice['status'],
                      style: const TextStyle(color: Colors.white, fontSize: 10),
                    ),
                  ),
                ],
              ),
              onTap: () {
                // Navigate to details and upload
              },
            ),
          );
        },
      ),
    );
  }
}
