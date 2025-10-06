export default function ModernInputs() {
  return (
    <div>
            
            <div className="relative w-full">
            <select
                id="outlined-select"
                className="peer w-full border border-gray-400 rounded-md px-3 pt-4 pb-1 text-gray-900
                        focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm bg-white"
            >
                <option value="" disabled selected></option>
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
            </select>
            <label
                htmlFor="outlined-select"
                className="absolute left-3 -top-2.5 bg-white px-1 text-gray-500 text-xs transition-all duration-200
                        peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm
                        peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-500"
            >
                Select Option
            </label>
            </div>
    </div>
  );
}
