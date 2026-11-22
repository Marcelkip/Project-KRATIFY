// // DownloadReportButton.tsx
// "use client";

// import html2pdf from "html2pdf.js";
// import { Button } from "@/components/ui/button";

// type Props = { reportId: number };

// export default function DownloadReportButton({ reportId }: Props) {
//   const handleDownload = () => {
//     const element = document.getElementById("report-root");
//     if (!element) return;
//     html2pdf().from(element).save(`rapport-${reportId}.pdf`);
//   };

//   return (
//     <Button onClick={handleDownload} className="ml-2">
//       Download PDF
//     </Button>
//   );
// }
