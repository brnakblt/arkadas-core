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
    renameFile,
  } = useFiles('/');

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Selection & Edit Mode States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [fileToRename, setFileToRename] = useState<FileItem | null>(null);

  const toggleFileSelection = (filename: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(filename)) {
      newSelection.delete(filename);
    } else {
      newSelection.add(filename);
    }
    setSelectedFiles(newSelection);
  };

  const handleFilePress = (file: FileItem) => {
    if (isSelectionMode) {
      toggleFileSelection(file.filename);
    } else {
      if (file.type === 'directory') {
        navigate(file.filename);
      } else {
        handleDownload(file);
      }
    }
  };

  const handleFileLongPress = (file: FileItem) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      const newSet = new Set<string>();
      newSet.add(file.filename);
      setSelectedFiles(newSet);
    } else {
      toggleFileSelection(file.filename);
    }
  };

  const handleDownload = async (file: FileItem) => {
    const url = await downloadFile(file);
    if (url) {
      Linking.openURL(url);
    }
  };

  // Deprecated single delete (used context menu before, now selection mode)
  /* const handleDelete = (file: FileItem) => { ... } */

  const handleDeleteSelected = () => {
    if (selectedFiles.size === 0) return;

    Alert.alert(
      'Sil',
      `Seçili ${selectedFiles.size} öğeyi silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const filesToDelete = files.filter(f => selectedFiles.has(f.filename));
            // Show loading? Ideally yes. For now, sequential await.
            for (const file of filesToDelete) {
              await deleteFile(file);
            }
            setIsSelectionMode(false);
            setSelectedFiles(new Set());
          },
        },
      ]
    );
  };

  const handleRenameStart = () => {
    if (selectedFiles.size !== 1) return;
    const filename = Array.from(selectedFiles)[0];
    const file = files.find(f => f.filename === filename);
    if (file) {
      setFileToRename(file);
      setRenameText(file.basename);
      setShowRenameModal(true);
    }
  };

  const handleRenameSubmit = async () => {
    if (fileToRename && renameText.trim() && renameText !== fileToRename.basename) {
      const success = await renameFile(fileToRename, renameText);
      if (success) {
        setShowRenameModal(false);
        setIsSelectionMode(false);
        setSelectedFiles(new Set());
        setFileToRename(null);
      }
    }
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

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedFiles(new Set());
  };

  const renderItem = ({ item }: { item: FileItem }) => {
    const isSelected = selectedFiles.has(item.filename);
    return (
      <TouchableOpacity
        className={`flex-row items-center px-4 py-3 bg-white border-b border-gray-100 ${isSelected ? 'bg-indigo-50' : ''}`}
        onPress={() => handleFilePress(item)}
        onLongPress={() => handleFileLongPress(item)}
        delayLongPress={300}
      >
        {isSelectionMode && (
          <View className="mr-3">
             <FontAwesome 
                name={isSelected ? "check-square-o" : "square-o"} 
                size={24} 
                color={isSelected ? "#4f46e5" : "#9ca3af"} 
             />
          </View>
        )}
        
        <FontAwesome
          name={getFileIcon(item) as any}
          size={24}
          color={item.type === 'directory' ? '#f59e0b' : '#6b7280'}
          style={{ marginRight: 12, width: 28 }}
        />
        <View className="flex-1">
          <Text className={`text-base font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`} numberOfLines={1}>
            {item.basename}
          </Text>
          <Text className="text-xs text-gray-400">
            {item.type === 'file' ? formatFileSize(item.size) : ''} • {formatDate(item.lastmod)}
          </Text>
        </View>
        {!isSelectionMode && (
          <FontAwesome name="chevron-right" size={14} color="#d1d5db" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-indigo-600 px-4 py-3">
        {isSelectionMode ? (
          /* Selection Mode Header */
          <View className="flex-row items-center justify-between h-[34px]">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={exitSelectionMode}>
                <FontAwesome name="times" size={20} color="white" />
              </TouchableOpacity>
              <Text className="text-white text-lg font-semibold">
                {selectedFiles.size} Seçili
              </Text>
            </View>
            <View className="flex-row gap-4">
              {selectedFiles.size === 1 && (
                <TouchableOpacity onPress={handleRenameStart}>
                  <FontAwesome name="pencil" size={20} color="white" />
                </TouchableOpacity>
              )}
              {selectedFiles.size > 0 && (
                 <TouchableOpacity onPress={handleDeleteSelected}>
                   <FontAwesome name="trash-o" size={22} color="white" />
                 </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          /* Normal Header */
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
              <TouchableOpacity onPress={() => setIsSelectionMode(true)}>
                 <FontAwesome name="check-square-o" size={22} color="white" />
              </TouchableOpacity>
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
        )}
        {!isSelectionMode && (
           <Text className="text-white/60 text-xs mt-1">{currentPath}</Text>
        )}
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

      {/* Rename Modal */}
      <Modal visible={showRenameModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full">
            <Text className="text-lg font-semibold mb-4">Yeniden Adlandır</Text>
            <TextInput
              value={renameText}
              onChangeText={setRenameText}
              placeholder="Yeni isim"
              className="border border-gray-200 rounded-lg px-4 py-3 mb-4"
              autoFocus
            />
            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => setShowRenameModal(false)}
                className="px-4 py-2"
              >
                <Text className="text-gray-600">İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRenameSubmit}
                className="bg-indigo-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}