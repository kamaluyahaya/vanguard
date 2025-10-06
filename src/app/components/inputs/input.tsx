interface MyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function MyInput({ label, error, ...props }: MyInputProps) {
  return (
    <div className="w-full">
      <div className="relative w-full">
        <input
          {...props}
          placeholder=" "
          className={`peer w-full rounded-xl px-4 pt-4 pb-2 text-gray-900 text-sm
            bg-transparent text-white backdrop-blur-xl border-2 border-gray-300/50 shadow-inner
            transition-all duration-300 placeholder-transparent
            focus:border-white-500 focus:outline-none
            ${error ? "border-red-500 focus:ring-red-500/40" : "border-gray-300/50"}`}
        />
        <label
          htmlFor={props.id}
          className="absolute left-4 -top-2.5 bg-[#071033] px-1 text-gray-600 text-xs transition-all duration-300
            rounded-md
            peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm
            peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-white-500"
        >
          {label}
        </label>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
