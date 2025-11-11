'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  ChevronRight, 
  ChevronDown,
  Menu,
  Folder,
  FolderOpen
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  href: string;
  parentId?: string;
  order: number;
  isVisible: boolean;
}

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    // Main Categories
    { id: 'candles', name: 'Candles', href: '/collections/candles', order: 1, isVisible: true },
    { id: 'skincare', name: 'Skincare', href: '/collections/skincare', order: 2, isVisible: true },
    { id: 'body-oils', name: 'Body Oils', href: '/collections/body-oils', order: 3, isVisible: true },
    { id: 'room-sprays', name: 'Room Sprays', href: '/collections/room-sprays', order: 4, isVisible: true },
    { id: 'clothing', name: 'Clothing & Accessories', href: '/collections/clothing-accessories', order: 5, isVisible: true },
    { id: 'calm-down-girl', name: 'Calm Down Girl', href: '/collections/calm-down-girl', order: 6, isVisible: true },
    { id: 'all', name: 'All Products', href: '/collections/all', order: 7, isVisible: true },
    
    // Candle Subcategories
    { id: 'candles-all', name: 'All Candles', href: '/collections/candles/all', parentId: 'candles', order: 1, isVisible: true },
    { id: 'candles-citrus', name: 'Citrus', href: '/collections/candles/citrus', parentId: 'candles', order: 2, isVisible: true },
    { id: 'candles-earthy', name: 'Earthy', href: '/collections/candles/earthy', parentId: 'candles', order: 3, isVisible: true },
    { id: 'candles-floral', name: 'Floral', href: '/collections/candles/floral', parentId: 'candles', order: 4, isVisible: true },
    { id: 'candles-fresh', name: 'Fresh', href: '/collections/candles/fresh', parentId: 'candles', order: 5, isVisible: true },
    { id: 'candles-herbal', name: 'Herbal', href: '/collections/candles/herbal', parentId: 'candles', order: 6, isVisible: true },
    { id: 'candles-sweet', name: 'Sweet', href: '/collections/candles/sweet', parentId: 'candles', order: 7, isVisible: true },
    { id: 'candles-woodsy', name: 'Woodsy', href: '/collections/candles/woodsy', parentId: 'candles', order: 8, isVisible: true },
    
    // Skincare Subcategories
    { id: 'skincare-foaming-scrub', name: 'Foaming Body Scrub', href: '/collections/skincare/foaming-body-scrub', parentId: 'skincare', order: 1, isVisible: true },
    { id: 'skincare-body-mist', name: 'Body Spray Mist', href: '/collections/skincare/body-spray-mist', parentId: 'skincare', order: 2, isVisible: true },
    { id: 'skincare-lotion', name: 'Handmade Lotion', href: '/collections/skincare/handmade-lotion', parentId: 'skincare', order: 3, isVisible: true },
    { id: 'skincare-body-butter', name: 'Whipped Body Butter', href: '/collections/skincare/whipped-body-butter', parentId: 'skincare', order: 4, isVisible: true },
    { id: 'skincare-bar-soap', name: 'Natural Bar Soap', href: '/collections/skincare/natural-handmade-bar-soap', parentId: 'skincare', order: 5, isVisible: true }
  ]);

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['candles', 'skincare']));

  // Load menu items from localStorage on component mount
  useEffect(() => {
    const savedMenuItems = localStorage.getItem('adminMenuItems');
    if (savedMenuItems) {
      setMenuItems(JSON.parse(savedMenuItems));
    }
  }, []);

  // Save menu items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('adminMenuItems', JSON.stringify(menuItems));
  }, [menuItems]);

  const getMainCategories = () => {
    return menuItems.filter(item => !item.parentId).sort((a, b) => a.order - b.order);
  };

  const getSubcategories = (parentId: string) => {
    return menuItems.filter(item => item.parentId === parentId).sort((a, b) => a.order - b.order);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSaveItem = (item: MenuItem) => {
    setMenuItems(prev => prev.map(i => i.id === item.id ? item : i));
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this menu item? This will also delete all subcategories.')) {
      setMenuItems(prev => prev.filter(i => i.id !== itemId && i.parentId !== itemId));
    }
  };

  const handleAddNew = () => {
    if (newItem.name && newItem.href) {
      const id = newItem.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const maxOrder = Math.max(...menuItems.filter(i => i.parentId === newItem.parentId).map(i => i.order), 0);
      
      const item: MenuItem = {
        id,
        name: newItem.name,
        href: newItem.href,
        parentId: newItem.parentId,
        order: maxOrder + 1,
        isVisible: true
      };
      
      setMenuItems(prev => [...prev, item]);
      setNewItem({});
      setIsAddingNew(false);
    }
  };

  const handleToggleVisibility = (itemId: string) => {
    setMenuItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, isVisible: !i.isVisible } : i
    ));
  };

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    const siblings = menuItems.filter(i => i.parentId === item.parentId);
    const currentIndex = siblings.findIndex(i => i.id === itemId);
    
    if (direction === 'up' && currentIndex > 0) {
      const targetItem = siblings[currentIndex - 1];
      setMenuItems(prev => prev.map(i => {
        if (i.id === itemId) return { ...i, order: targetItem.order };
        if (i.id === targetItem.id) return { ...i, order: item.order };
        return i;
      }));
    } else if (direction === 'down' && currentIndex < siblings.length - 1) {
      const targetItem = siblings[currentIndex + 1];
      setMenuItems(prev => prev.map(i => {
        if (i.id === itemId) return { ...i, order: targetItem.order };
        if (i.id === targetItem.id) return { ...i, order: item.order };
        return i;
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Menu Management</h2>
          <p className="text-slate-600 dark:text-slate-400">Manage product categories and navigation structure</p>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Add New Item Form */}
      {isAddingNew && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Add New Menu Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name</label>
              <input
                type="text"
                value={newItem.name || ''}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="Category name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">URL Path</label>
              <input
                type="text"
                value={newItem.href || ''}
                onChange={(e) => setNewItem(prev => ({ ...prev, href: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="/collections/new-category"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Parent Category</label>
              <select
                value={newItem.parentId || ''}
                onChange={(e) => setNewItem(prev => ({ ...prev, parentId: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="">Main Category</option>
                {getMainCategories().map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4">
            <button
              onClick={handleAddNew}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setNewItem({});
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Menu Tree */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Current Menu Structure</h3>
          
          <div className="space-y-2">
            {getMainCategories().map(category => (
              <div key={category.id} className="border border-slate-200 dark:border-slate-600 rounded-lg">
                {/* Main Category */}
                <div className={`flex items-center justify-between p-4 ${!category.isVisible ? 'opacity-50' : ''}`}>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      {expandedCategories.has(category.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expandedCategories.has(category.id) ? (
                      <FolderOpen className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Folder className="h-5 w-5 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{category.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{category.href}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleVisibility(category.id)}
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        category.isVisible 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {category.isVisible ? 'Visible' : 'Hidden'}
                    </button>
                    <button
                      onClick={() => setEditingItem(category)}
                      className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(category.id)}
                      className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {expandedCategories.has(category.id) && (
                  <div className="border-t border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                    {getSubcategories(category.id).map(subcategory => (
                      <div key={subcategory.id} className={`flex items-center justify-between p-4 pl-12 border-b border-slate-200 dark:border-slate-600 last:border-b-0 ${!subcategory.isVisible ? 'opacity-50' : ''}`}>
                        <div className="flex items-center space-x-3">
                          <Menu className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{subcategory.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{subcategory.href}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleVisibility(subcategory.id)}
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              subcategory.isVisible 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                          >
                            {subcategory.isVisible ? 'Visible' : 'Hidden'}
                          </button>
                          <button
                            onClick={() => setEditingItem(subcategory)}
                            className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(subcategory.id)}
                            className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Edit Menu Item</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">URL Path</label>
                <input
                  type="text"
                  value={editingItem.href}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, href: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => handleSaveItem(editingItem)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => setEditingItem(null)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
