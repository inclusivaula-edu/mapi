export default function Header({ email }) {
  return (
    <header className="bg-white p-4 shadow flex justify-between">
      <span className="font-semibold">MAPI Dashboard</span>
      <span className="text-sm text-gray-600">{email}</span>
    </header>
  );
}