'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { useDebounce } from '@/hooks/useDebounce';

const SearchableSelect = ({
  value,
  onChange,
  placeholder = 'Chọn...',
  isDisabled = false,
  isLoading = false,
  loadOptions,
  minSearchLength = 2,
  debounceDelay = 300,
  noOptionsMessage = 'Không có lựa chọn',
  loadingMessage = 'Đang tải...',
  defaultOption = null,
  ...props
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const debouncedInputValue = useDebounce(inputValue, debounceDelay);

  // Custom styles for react-select to match Tailwind design
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#9ca3af',
      },
      fontSize: '14px',
      backgroundColor: isDisabled ? '#f9fafb' : '#ffffff',
      cursor: isDisabled ? 'not-allowed' : 'text',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : '#ffffff',
      color: state.isSelected ? '#ffffff' : '#111827',
      fontSize: '14px',
      padding: '8px 12px',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: state.isSelected ? '#3b82f6' : '#e5e7eb',
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      zIndex: 50,
    }),
    menuList: (base) => ({
      ...base,
      borderRadius: '8px',
      padding: '4px',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
      fontSize: '14px',
    }),
    singleValue: (base) => ({
      ...base,
      color: '#111827',
      fontSize: '14px',
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: '#6b7280',
      fontSize: '14px',
      padding: '8px 12px',
    }),
    loadingMessage: (base) => ({
      ...base,
      color: '#6b7280',
      fontSize: '14px',
      padding: '8px 12px',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: '#6b7280',
      transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'none',
      transition: 'transform 0.2s ease',
      '&:hover': {
        color: '#4b5563',
      },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: '#6b7280',
      '&:hover': {
        color: '#4b5563',
      },
    }),
  };

  // Load options based on input value
  const loadOptionsCallback = useCallback(async (searchValue) => {
    if (!loadOptions) return;

    setIsSearching(true);
    try {
      const results = await loadOptions(searchValue);
      setOptions(results || []);
    } catch (error) {
      console.error('Error loading options:', error);
      setOptions([]);
    } finally {
      setIsSearching(false);
    }
  }, [loadOptions]);

  // Initialize with empty options
  useEffect(() => {
    if (!isInitialized && loadOptions) {
      loadOptionsCallback('');
      setIsInitialized(true);
    }
  }, [isInitialized, loadOptions, loadOptionsCallback]);

  // Handle search
  useEffect(() => {
    if (debouncedInputValue.length >= minSearchLength || debouncedInputValue.length === 0) {
      loadOptionsCallback(debouncedInputValue);
    } else {
      setOptions([]);
    }
  }, [debouncedInputValue, minSearchLength, loadOptionsCallback]);
  // Handle input change
  const handleInputChange = (newValue) => {
    setInputValue(newValue);
  };

  // Handle selection change
  const handleChange = (selectedOption) => {
    if (props.returnFullOption) {
      onChange(selectedOption);
    } else {
      onChange(selectedOption ? selectedOption.value : null);
    }
  };

  // Find the selected option from the options array
  const selectedOption = options.find(option => option.value === value) ||
    (defaultOption && defaultOption.value === value ? defaultOption : null) || null;

  return (
    <Select
      value={selectedOption}
      onChange={handleChange}
      onInputChange={handleInputChange}
      options={options}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isLoading={isLoading || isSearching}
      noOptionsMessage={() => inputValue.length < minSearchLength ? `Nhập ít nhất ${minSearchLength} ký tự` : noOptionsMessage}
      loadingMessage={() => loadingMessage}
      styles={customStyles}
      isClearable
      isSearchable
      {...props}
    />
  );
};

export default SearchableSelect;