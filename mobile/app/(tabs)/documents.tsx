import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as DocumentPicker from 'expo-document-picker';
import { useFiles, FileItem } from '@/hooks/useFiles';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getFileIcon = (file: FileItem): string => {
  if (file.type === 'directory') return 'folder';
  const mime = file.mime || '';
  if (mime.startsWith('image/')) return 'image';
  if (mime.includes('pdf')) return 'file-pdf-o';
  if (mime.includes('word') || mime.includes('document')) return 'file-word-o';
  if (mime.includes('excel') || mime.includes('spreadsheet')) return 'file-excel-o';
  return 'file-o';
};

export default function DocumentsScreen() {
  const {
    files,
    currentPath,
    isLoading,
    error,
    navigate,
    goBack,
    refresh,
    uploadFile,
    downloadFile,
    deleteFile,
    createFolder,
  } = useFiles('/');

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFilePress = (file: FileItem) => {
    if (file.type === 'directory') {
      navigate(file.filename);
    } else {
      handleDownload(file);
    }
  };

  const handleDownload = async (file: FileItem) => {
    const url = await downloadFile(file);
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleDelete = (file: FileItem) => {
    Alert.alert(
      'Sil',
      `"${file.basename}" silinecek. Emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => deleteFile(file),
        },
      ]
    );
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setIsUploading(true);
        const asset = result.assets[0];
        await uploadFile(asset.uri, asset.name);
        setIsUploading(false);
      }
    } catch (err) {
      setIsUploading(false);
      Alert.alert('Hata', 'Dosya yüklenemedi');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName);
    setShowNewFolderModal(false);
    setNewFolderName('');
  };

  const renderItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100"
      onPress={() => handleFilePress(item)}
      onLongPress={() => handleDelete(item)}
    >
      <FontAwesome
        name={getFileIcon(item) as any}
        size={24}
        color={item.type === 'directory' ? '#f59e0b' : '#6b7280'}
        style={{ marginRight: 12, width: 28 }}
      />
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-800" numberOfLines={1}>
          {item.basename}
        </Text>
        <Text className="text-xs text-gray-400">
          {item.type === 'file' ? formatFileSize(item.size) : ''} • {formatDate(item.lastmod)}
        </Text>
      </View>
      <FontAwesome name="chevron-right" size={14} color="#d1d5db" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header with path and actions */}
      <View className="bg-indigo-600 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {currentPath !== '/' && (
              <TouchableOpacity onPress={goBack} className="mr-3">
                <FontAwesome name="arrow-left" size={20} color="white" />
              </TouchableOpacity>
            )}
            <Text className="text-white text-lg font-semibold" numberOfLines={1}>
              {currentPath === '/' ? 'Dosyalar' : currentPath.split('/').pop()}
            </Text>
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={() => setShowNewFolderModal(true)}>
              <FontAwesome name="folder-o" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <FontAwesome name="cloud-upload" size={22} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <Text className="text-white/60 text-xs mt-1">{currentPath}</Text>
      </View>

      {/* Error */}
      {error && (
        <View className="bg-red-50 px-4 py-2">
          <Text className="text-red-600 text-sm">{error}</Text>
        </View>
      )}

      {/* File List */}
      <FlatList
        data={files}
        keyExtractor={(item) => item.filename}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-12">
              <FontAwesome name="folder-open-o" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3">Bu klasör boş</Text>
            </View>
          ) : null
        }
      />

      {/* New Folder Modal */}
      <Modal visible={showNewFolderModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full">
            <Text className="text-lg font-semibold mb-4">Yeni Klasör</Text>
            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Klasör adı"
              className="border border-gray-200 rounded-lg px-4 py-3 mb-4"
              autoFocus
            />
            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => setShowNewFolderModal(false)}
                className="px-4 py-2"
              >
                <Text className="text-gray-600">İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateFolder}
                className="bg-indigo-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">Oluştur</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

