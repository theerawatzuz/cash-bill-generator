"use client";
import { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import ReactDOM from "react-dom/client";
import SignatureCanvas from "react-signature-canvas";

export default function QuotationForm() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("light");
  const [billingNumber, setBillingNumber] = useState("");
  const [seller, setSeller] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
  });
  const [customer, setCustomer] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
  });
  const [items, setItems] = useState([{ name: "", quantity: 1, price: 0 }]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");

    // สร้าง billing number
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const day = today.getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    setBillingNumber(`Q${year}${month}${day}-${random}`);
  }, []);

  if (!mounted) {
    return null; // หรือแสดง loading state
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const addItem = () =>
    setItems([...items, { name: "", quantity: 1, price: 0 }]);

  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  const handlePreviewClick = async () => {
    try {
      // สร้าง container ชั่วคราวสำหรับ generate
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.width = "793px"; // A4 width in pixels
      document.body.appendChild(tempContainer);

      // สร้าง content สำหรับ generate
      const content = (
        <div
          className="bg-white p-8 text-black"
          style={{ width: "793px", height: "1122px" }}
        >
          <h1 className="text-3xl font-bold mb-6">ใบเสนอราคา</h1>
          <p className="text-lg mb-4">เลขที่: {billingNumber}</p>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h2 className="font-bold mb-2">ข้อมูลผู้เสนอราคา</h2>
              <p>ชื่อ: {seller.name || "-"}</p>
              <p>ที่อยู่: {seller.address || "-"}</p>
              <p>อีเมล: {seller.email || "-"}</p>
              <p>เบอร์โทร: {seller.phone || "-"}</p>
            </div>
            <div>
              <h2 className="font-bold mb-2">ข้อมูลลูกค้า</h2>
              <p>ชื่อ: {customer.name || "-"}</p>
              <p>ที่อยู่: {customer.address || "-"}</p>
              <p>อีเมล: {customer.email || "-"}</p>
              <p>เบอร์โทร: {customer.phone || "-"}</p>
            </div>
          </div>

          <div>
            <h2 className="font-bold mb-2">รายการสินค้า</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">รายการ</th>
                  <th className="text-right py-2">จำนวน</th>
                  <th className="text-right py-2">ราคาต่อหน่วย</th>
                  <th className="text-right py-2">รวม</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{item.name || "-"}</td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">
                      {item.price.toLocaleString()}
                    </td>
                    <td className="text-right py-2">
                      {(item.quantity * item.price).toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td colSpan={3} className="text-right py-2">
                    รวมทั้งสิ้น:
                  </td>
                  <td className="text-right py-2">
                    {items
                      .reduce(
                        (sum, item) => sum + item.quantity * item.price,
                        0
                      )
                      .toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* เพิ่มส่วนแสดงผู้รับเงิน */}
            <div className="mt-16 flex justify-end">
              <div className="text-center">
                <p className="mb-2">ผู้รับเงิน</p>
                <p className="border-b border-black min-w-[200px] py-1">
                  {seller.name || "............................"}
                </p>
              </div>
            </div>
          </div>
        </div>
      );

      // Render content ลงใน container
      const root = ReactDOM.createRoot(tempContainer);
      root.render(content);

      // รอให้ render เสร็จ
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Generate ภาพ
      const canvas = await html2canvas(
        tempContainer.firstChild as HTMLElement,
        {
          scale: 2,
          width: 793,
          height: 1122,
          backgroundColor: "#ffffff",
        }
      );

      // ลบ container ชั่วคราว
      document.body.removeChild(tempContainer);

      // แปลงเป็น image data
      const imgData = canvas.toDataURL("image/png");
      setPreviewImage(imgData);
      setShowPreview(true);
    } catch (error) {
      console.error("Error generating preview:", error);
      alert("เกิดข้อผิดพลาดในการสร้างตัวอย่าง");
    }
  };

  const generatePDF = () => {
    if (!previewImage) return;

    // สร้าง PDF ขนาด A4
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // เพิ่มรูปภาพลงใน PDF
    pdf.addImage(previewImage, "PNG", 0, 0, 210, 297);

    // ดาวน์โหลด PDF
    pdf.save(`quotation-${billingNumber}.pdf`);
  };

  const generatePNG = () => {
    if (!previewImage) return;

    // สร้าง element a สำหรับดาวน์โหลด
    const link = document.createElement("a");
    link.href = previewImage;
    link.download = `quotation-${billingNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SignaturePad = () => {
    const sigPadRef = useRef<any>(null);

    const clear = () => {
      sigPadRef.current?.clear();
      setSignature(null);
    };

    const save = () => {
      if (sigPadRef.current?.isEmpty()) {
        alert("กรุณาเซ็นลายเซ็นก่อน");
        return;
      }
      const signatureData = sigPadRef.current
        ?.getTrimmedCanvas()
        .toDataURL("image/png");
      setSignature(signatureData);
      setShowSignaturePad(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg w-[95%] max-w-[500px]">
          <h3 className="text-lg font-semibold mb-2">เซ็นลายเซ็น</h3>
          <div className="border border-gray-300 mb-4 bg-white">
            <SignatureCanvas
              ref={sigPadRef}
              canvasProps={{
                className: "w-full h-[200px]",
                style: {
                  touchAction: "none", // จำเป็นสำหรับ touch events
                  width: "100%",
                  height: "200px",
                },
              }}
              backgroundColor="white"
              penColor="black"
            />
          </div>
          <div className="flex justify-between gap-2">
            <button
              onClick={clear}
              className="bg-gray-500 text-white px-4 py-2 rounded flex-1"
            >
              ล้าง
            </button>
            <button
              onClick={save}
              className="bg-blue-500 text-white px-4 py-2 rounded flex-1"
            >
              ตกลง
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            * สามารถใช้เมาส์, ปากกา หรือนิ้วในการเซ็นลายเซ็น
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* ปุ่มแสดงตัวอย่าง */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">ใบเสนอราคา</h1>
        <button
          onClick={toggleTheme}
          className="bg-gray-800 text-white px-4 py-2 rounded dark:bg-gray-300 dark:text-black"
        >
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
      </div>

      {/* Billing Number */}
      <h2 className="text-lg font-semibold">
        เลขที่ใบเสนอราคา:{" "}
        <span suppressHydrationWarning>{billingNumber || "กำลังโหลด..."}</span>
      </h2>

      {/* ฟอร์มกรอกข้อมูล */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <h2 className="font-semibold">ข้อมูลผู้เสนอราคา</h2>
          <input
            type="text"
            placeholder="ชื่อ"
            value={seller.name}
            onChange={(e) => setSeller({ ...seller, name: e.target.value })}
            className="border p-2 w-full mt-1 bg-transparent"
          />
          <input
            type="text"
            placeholder="ที่อยู่"
            value={seller.address}
            onChange={(e) => setSeller({ ...seller, address: e.target.value })}
            className="border p-2 w-full mt-1 bg-transparent"
          />
          <input
            type="email"
            placeholder="อีเมล"
            value={seller.email}
            onChange={(e) => setSeller({ ...seller, email: e.target.value })}
            className="border p-2 w-full mt-1 bg-transparent"
          />
          <input
            type="tel"
            placeholder="เบอร์โทร"
            value={seller.phone}
            onChange={(e) => setSeller({ ...seller, phone: e.target.value })}
            className="border p-2 w-full mt-1 bg-transparent"
          />
        </div>

        <div>
          <h2 className="font-semibold">ข้อมูลลูกค้า</h2>
          <input
            type="text"
            placeholder="ชื่อ"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            className="border p-2 w-full mt-1 bg-transparent"
          />
          <input
            type="text"
            placeholder="ที่อยู่"
            value={customer.address}
            onChange={(e) =>
              setCustomer({ ...customer, address: e.target.value })
            }
            className="border p-2 w-full mt-1 bg-transparent"
          />
          <input
            type="email"
            placeholder="อีเมล"
            value={customer.email}
            onChange={(e) =>
              setCustomer({ ...customer, email: e.target.value })
            }
            className="border p-2 w-full mt-1 bg-transparent"
          />
          <input
            type="tel"
            placeholder="เบอร์โทร"
            value={customer.phone}
            onChange={(e) =>
              setCustomer({ ...customer, phone: e.target.value })
            }
            className="border p-2 w-full mt-1 bg-transparent"
          />
        </div>
      </div>

      {/* รายการสินค้า */}
      <h2 className="font-semibold mt-4">รายการสินค้า</h2>
      {items.map((item, index) => (
        <div key={index} className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="ชื่อรายการ"
            value={item.name}
            onChange={(e) => {
              const newItems = [...items];
              newItems[index].name = e.target.value;
              setItems(newItems);
            }}
            className="border p-2 flex-grow bg-transparent"
          />
          <input
            type="number"
            placeholder="จำนวน"
            value={item.quantity}
            onChange={(e) => {
              const newItems = [...items];
              newItems[index].quantity = parseInt(e.target.value) || 1;
              setItems(newItems);
            }}
            className="border p-2 w-20 bg-transparent"
          />
          <input
            type="number"
            placeholder="ราคา"
            value={item.price}
            onChange={(e) => {
              const newItems = [...items];
              newItems[index].price = parseFloat(e.target.value) || 0;
              setItems(newItems);
            }}
            className="border p-2 w-32 bg-transparent"
          />
          <div className="border p-2 w-32 bg-transparent text-right">
            {(item.quantity * item.price).toLocaleString()}
          </div>
          <button onClick={() => removeItem(index)} className="text-red-500">
            ❌
          </button>
        </div>
      ))}

      {/* ปุ่มเพิ่มรายการ */}
      <div className="mt-2">
        <button
          onClick={addItem}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          ➕ เพิ่มรายการ
        </button>
      </div>

      {/* แสดงผลรวม */}
      <div className="flex justify-end mt-4 gap-2">
        <div className="font-semibold">รวมทั้งสิ้น:</div>
        <div className="w-32 text-right">
          {items
            .reduce((sum, item) => sum + item.quantity * item.price, 0)
            .toLocaleString()}{" "}
          บาท
        </div>
      </div>

      {/* ผู้รับเงิน */}
      <div className="flex justify-end mt-4 gap-2">
        <div className="font-semibold">ผู้รับเงิน:</div>
        <input
          type="text"
          placeholder="ระบุชื่อผู้รับเงิน"
          value={seller.name}
          onChange={(e) => setSeller({ ...seller, name: e.target.value })}
          className="border-b w-48 text-center bg-transparent"
        />
      </div>

      {/* ปุ่มแสดงตัวอย่าง */}
      <div className="flex justify-center mt-4">
        <button
          onClick={handlePreviewClick}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          👀 แสดงตัวอย่าง
        </button>
      </div>

      {/* Modal Preview */}
      {showPreview && previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full"
            style={{
              maxHeight: "90vh", // กำหนดความสูงสูงสุดของ modal
              overflowY: "auto", // ทำให้เลื่อนเนื้อหาได้
            }}
            onClick={(e) => e.stopPropagation()} // ป้องกัน modal ปิดเมื่อกดข้างใน
          >
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              ×
            </button>

            <div className="p-4">
              <img
                src={previewImage}
                alt="ตัวอย่างใบเสนอราคา"
                className="w-full h-auto"
              />
            </div>

            <div className="flex gap-4 justify-center p-4 border-t">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  generatePDF();
                }}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition cursor-pointer"
              >
                📄 บันทึกเป็น PDF
              </a>
              <a
                href={previewImage}
                download={`quotation-${billingNumber}.png`}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                🖼️ บันทึกเป็น PNG
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad */}
      {showSignaturePad && <SignaturePad />}
    </div>
  );
}
