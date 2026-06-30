import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:local_auth/local_auth.dart';

class AuthProvider with ChangeNotifier {
  final _storage = const FlutterSecureStorage();
  final _localAuth = LocalAuthentication();

  String? _token;
  Map<String, dynamic>? _user;
  bool _useBiometrics = false;

  bool get isAuthenticated => _token != null;
  Map<String, dynamic>? get user => _user;
  bool get useBiometrics => _useBiometrics;

  final String baseUrl = 'http://localhost:3001/api'; // Use env in production

  AuthProvider() {
    _loadSession();
  }

  Future<void> _loadSession() async {
    _token = await _storage.read(key: 'jwt_token');
    String? userStr = await _storage.read(key: 'user_data');
    String? bio = await _storage.read(key: 'use_biometrics');
    _useBiometrics = bio == 'true';

    if (userStr != null) {
      _user = jsonDecode(userStr);
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _token = data['token'];
        _user = data['user'];

        await _storage.write(key: 'jwt_token', value: _token);
        await _storage.write(key: 'user_data', value: jsonEncode(_user));

        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    await _storage.delete(key: 'jwt_token');
    await _storage.delete(key: 'user_data');
    notifyListeners();
  }

  Future<bool> authenticateWithBiometrics() async {
    try {
      final bool canAuthenticateWithBiometrics = await _localAuth.canCheckBiometrics;
      final bool canAuthenticate = canAuthenticateWithBiometrics || await _localAuth.isDeviceSupported();

      if (!canAuthenticate) return false;

      return await _localAuth.authenticate(
        localizedReason: 'Silakan verifikasi biometrik Anda untuk masuk',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );
    } catch (e) {
      return false;
    }
  }

  Future<void> setBiometrics(bool value) async {
    _useBiometrics = value;
    await _storage.write(key: 'use_biometrics', value: value.toString());
    notifyListeners();
  }
}
