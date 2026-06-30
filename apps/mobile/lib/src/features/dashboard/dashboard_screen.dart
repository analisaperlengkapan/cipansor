import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/auth_provider.dart';
import '../finance/invoice_list_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard Orang Tua'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => Provider.of<AuthProvider>(context, listen: false).logout(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Selamat Datang, ${user?['name'] ?? 'Wali Santri'}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            _buildAchievementCard(context),
            const SizedBox(height: 16),
            _buildMenuGrid(context),
          ],
        ),
      ),
    );
  }

  Widget _buildAchievementCard(BuildContext context) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.stars, color: Colors.orange),
                SizedBox(width: 8),
                Text('Capaian Anak Terakhir', style: TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            const Divider(),
            const ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Progres Tahfidz'),
              subtitle: Text('Juz 30: An-Naba s/d Al-Inshiqaq'),
              trailing: Text('85%', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
            ),
            const ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Nilai Akademik (Raport)'),
              subtitle: Text('Semester Ganjil 2024/2025'),
              trailing: Text('B+', style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuGrid(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      children: [
        _buildMenuItem(
          context,
          'Pembayaran SPP',
          Icons.payments,
          Colors.blue,
          () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InvoiceListScreen())),
        ),
        _buildMenuItem(context, 'Riwayat Tahfidz', Icons.menu_book, Colors.green, () {}),
        _buildMenuItem(context, 'Raport Digital', Icons.assignment, Colors.purple, () {}),
        _buildMenuItem(context, 'Pengaturan', Icons.settings, Colors.grey, () {}),
      ],
    );
  }

  Widget _buildMenuItem(BuildContext context, String title, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.5)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40, color: color),
            const SizedBox(height: 8),
            Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }
}
