import { FiSearch } from 'react-icons/fi';

function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="search-input">
      <FiSearch />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default SearchInput;
