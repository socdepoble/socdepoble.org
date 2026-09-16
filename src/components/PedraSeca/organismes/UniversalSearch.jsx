import { Search } from 'lucide-react';

export function UniversalSearch({ value, onChange, placeholder, ariaLabel }) {
  return (
    <div className="universal-search-wrapper">
      <Search size={20} className="universal-search-icon" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder || 'Cerca...'}
        aria-label={ariaLabel || 'Cercador universal'}
        className="universal-search-input"
      />
    </div>
  );
}
