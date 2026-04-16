import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, X, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ── CSV column definitions ──
const CSV_COLUMNS = [
  'name', 'category', 'price', 'original_price', 'stock_count',
  'description', 'image_url', 'badge', 'fabric', 'weave_type',
  'material', 'care', 'origin',
];

const REQUIRED_COLUMNS = ['name', 'category', 'price'];

const SAMPLE_ROWS = [
  {
    name: 'Kanchipuram Silk Saree — Maroon',
    category: 'Silk Sarees',
    price: '5999',
    original_price: '7999',
    stock_count: '10',
    description: 'Traditional Kanchipuram silk saree with gold zari border and pallu.',
    image_url: 'https://your-bucket.supabase.co/storage/v1/object/public/product-images/saree1.jpg',
    badge: 'New',
    fabric: 'Pure Kanchipuram Silk',
    weave_type: 'Zari Jaal',
    material: '',
    care: 'Dry clean only',
    origin: 'Kanchipuram, Tamil Nadu',
  },
  {
    name: 'Temple Necklace Set — Gold',
    category: 'Jewellery',
    price: '2499',
    original_price: '',
    stock_count: '25',
    description: 'Handcrafted temple jewellery necklace with matching jhumkas.',
    image_url: 'https://your-bucket.supabase.co/storage/v1/object/public/product-images/necklace1.jpg',
    badge: '',
    fabric: '',
    weave_type: '',
    material: 'Gold-plated Brass',
    care: 'Wipe with soft cloth',
    origin: '',
  },
];

// ── Generate and download CSV template ──
function downloadCSVTemplate() {
  const header = CSV_COLUMNS.join(',');
  const rows = SAMPLE_ROWS.map((row) =>
    CSV_COLUMNS.map((col) => {
      const val = row[col] || '';
      // Wrap in quotes if contains comma
      return val.includes(',') ? `"${val}"` : val;
    }).join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'little-shop-products-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Validate a single row ──
function validateRow(row, index) {
  const errors = [];
  if (!row.name?.trim()) errors.push(`Row ${index + 1}: Missing "name"`);
  if (!row.category?.trim()) errors.push(`Row ${index + 1}: Missing "category"`);
  const price = parseFloat(row.price);
  if (!row.price || isNaN(price) || price <= 0) errors.push(`Row ${index + 1}: Invalid "price" (must be > 0)`);
  return errors;
}

// ── Map CSV row to Supabase products table shape ──
function mapRowToProduct(row) {
  const fabric = {};
  if (row.fabric?.trim()) fabric.fabric = row.fabric.trim();
  if (row.weave_type?.trim()) fabric.weaveType = row.weave_type.trim();
  if (row.material?.trim()) fabric.material = row.material.trim();
  if (row.care?.trim()) fabric.care = row.care.trim();
  if (row.origin?.trim()) fabric.origin = row.origin.trim();

  return {
    name: row.name.trim(),
    category: row.category.trim(),
    price: parseFloat(row.price),
    original_price: row.original_price ? parseFloat(row.original_price) : null,
    stock_count: parseInt(row.stock_count) || 0,
    description: row.description?.trim() || null,
    image_url: row.image_url?.trim() || null,
    badge: ['New', 'Sale', 'Bestseller'].includes(row.badge?.trim()) ? row.badge.trim() : null,
    fabric: Object.keys(fabric).length > 0 ? fabric : {},
  };
}

// ── Batch size for inserts ──
const BATCH_SIZE = 20;

export default function BulkImportModal({ isOpen, onClose, onImportComplete }) {
  const [step, setStep] = useState('upload'); // upload | preview | importing | done
  const [parsedRows, setParsedRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [failedRows, setFailedRows] = useState([]);
  const [fileName, setFileName] = useState('');

  const reset = () => {
    setStep('upload');
    setParsedRows([]);
    setValidationErrors([]);
    setImportProgress(0);
    setImportedCount(0);
    setFailedRows([]);
    setFileName('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ── Parse dropped CSV ──
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        const rows = results.data;

        // Check required columns exist in header
        const headers = Object.keys(rows[0] || {});
        const missingCols = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
        if (missingCols.length > 0) {
          setValidationErrors([`Missing required columns: ${missingCols.join(', ')}. Download the template for reference.`]);
          setStep('preview');
          return;
        }

        // Validate each row
        const allErrors = [];
        rows.forEach((row, i) => {
          allErrors.push(...validateRow(row, i));
        });

        setParsedRows(rows);
        setValidationErrors(allErrors);
        setStep('preview');
      },
      error: (err) => {
        setValidationErrors([`CSV parsing error: ${err.message}`]);
        setStep('preview');
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  // ── Bulk insert to Supabase in batches ──
  const handleImport = async () => {
    if (validationErrors.length > 0) return;
    setStep('importing');
    setImportProgress(0);
    setImportedCount(0);
    setFailedRows([]);

    const products = parsedRows.map(mapRowToProduct);
    const totalBatches = Math.ceil(products.length / BATCH_SIZE);
    let inserted = 0;
    const failed = [];

    for (let i = 0; i < totalBatches; i++) {
      const batch = products.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      try {
        const { data, error } = await supabase
          .from('products')
          .insert(batch)
          .select();

        if (error) {
          console.error(`Batch ${i + 1} failed:`, error.message);
          failed.push(...batch.map((p, j) => ({ row: i * BATCH_SIZE + j + 1, name: p.name, error: error.message })));
        } else {
          inserted += (data?.length || batch.length);
        }
      } catch (e) {
        failed.push(...batch.map((p, j) => ({ row: i * BATCH_SIZE + j + 1, name: p.name, error: e.message })));
      }
      setImportProgress(Math.round(((i + 1) / totalBatches) * 100));
      setImportedCount(inserted);
    }

    setFailedRows(failed);
    setStep('done');
    if (inserted > 0 && onImportComplete) onImportComplete();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-playfair text-xl text-purple-primary">Bulk Import Products</h2>
              <p className="font-inter text-xs text-gray-400 mt-1">Upload a CSV file to add multiple products at once</p>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {/* ═══ STEP 1: Upload ═══ */}
            {step === 'upload' && (
              <div className="space-y-6">
                {/* Download Template */}
                <div className="bg-purple-primary/5 border border-purple-primary/20 rounded-sm p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-purple-primary" />
                    <div>
                      <p className="font-inter text-sm font-medium text-gray-700">Download CSV Template</p>
                      <p className="font-inter text-[10px] text-gray-400">Pre-filled with 2 sample products and all column headers</p>
                    </div>
                  </div>
                  <button
                    onClick={downloadCSVTemplate}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-primary text-white font-inter text-xs hover:bg-emerald-900 transition-colors rounded-sm"
                  >
                    <Download size={14} /> Download
                  </button>
                </div>

                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-sm p-10 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-purple-primary bg-purple-primary/5' : 'border-gray-200 hover:border-purple-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="font-inter text-sm text-gray-500">
                    {isDragActive ? 'Drop your CSV file here...' : 'Drag & drop your CSV file here'}
                  </p>
                  <p className="font-inter text-xs text-gray-400 mt-1">or click to browse</p>
                  <p className="font-inter text-[10px] text-gray-300 mt-3">Accepts .csv files only</p>
                </div>

                {/* Column Reference */}
                <div className="bg-gray-50 rounded-sm p-4">
                  <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-2 font-medium">Required Columns</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CSV_COLUMNS.map((col) => (
                      <span
                        key={col}
                        className={`font-inter text-[10px] px-2 py-1 rounded-full ${
                          REQUIRED_COLUMNS.includes(col)
                            ? 'bg-purple-primary/10 text-purple-primary font-medium'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {col}{REQUIRED_COLUMNS.includes(col) ? ' *' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 2: Preview & Validate ═══ */}
            {step === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <FileText size={16} className="text-purple-primary" />
                  <span className="font-inter text-sm text-gray-700">{fileName}</span>
                  <span className="font-inter text-xs text-gray-400">{parsedRows.length} rows found</span>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-sm p-4 max-h-40 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={14} className="text-red-500" />
                      <p className="font-inter text-xs font-medium text-red-600">{validationErrors.length} validation error(s)</p>
                    </div>
                    <ul className="space-y-1">
                      {validationErrors.slice(0, 20).map((err, i) => (
                        <li key={i} className="font-inter text-[11px] text-red-500">{err}</li>
                      ))}
                      {validationErrors.length > 20 && (
                        <li className="font-inter text-[11px] text-red-400">...and {validationErrors.length - 20} more</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Preview Table */}
                {parsedRows.length > 0 && validationErrors.length === 0 && (
                  <div className="border border-gray-100 rounded-sm overflow-hidden">
                    <div className="overflow-x-auto max-h-60">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 font-inter text-[10px] tracking-wider uppercase text-gray-400">#</th>
                            <th className="px-3 py-2 font-inter text-[10px] tracking-wider uppercase text-gray-400">Name</th>
                            <th className="px-3 py-2 font-inter text-[10px] tracking-wider uppercase text-gray-400">Category</th>
                            <th className="px-3 py-2 font-inter text-[10px] tracking-wider uppercase text-gray-400">Price</th>
                            <th className="px-3 py-2 font-inter text-[10px] tracking-wider uppercase text-gray-400">Stock</th>
                            <th className="px-3 py-2 font-inter text-[10px] tracking-wider uppercase text-gray-400">Image</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {parsedRows.slice(0, 10).map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                              <td className="px-3 py-2 font-inter text-[10px] text-gray-400">{i + 1}</td>
                              <td className="px-3 py-2 font-inter text-xs text-gray-700 max-w-[160px] truncate">{row.name}</td>
                              <td className="px-3 py-2 font-inter text-xs text-gray-500">{row.category}</td>
                              <td className="px-3 py-2 font-inter text-xs text-purple-primary font-medium">₹{row.price}</td>
                              <td className="px-3 py-2 font-inter text-xs text-gray-500">{row.stock_count || 0}</td>
                              <td className="px-3 py-2 font-inter text-[10px] text-gray-400 max-w-[100px] truncate">{row.image_url ? '✓' : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedRows.length > 10 && (
                      <div className="bg-gray-50 px-3 py-2 text-center">
                        <p className="font-inter text-[10px] text-gray-400">Showing 10 of {parsedRows.length} rows</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={reset}
                    className="flex-1 py-3 border border-gray-200 font-inter text-sm text-gray-600 hover:bg-gray-50 transition-colors rounded-sm"
                  >
                    Upload Different File
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={validationErrors.length > 0 || parsedRows.length === 0}
                    className="flex-1 py-3 bg-purple-primary text-white font-inter text-sm hover:bg-emerald-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded-sm"
                  >
                    <Upload size={14} /> Import {parsedRows.length} Products
                  </button>
                </div>
              </div>
            )}

            {/* ═══ STEP 3: Importing ═══ */}
            {step === 'importing' && (
              <div className="py-8 text-center space-y-6">
                <Loader2 size={40} className="mx-auto text-purple-primary animate-spin" />
                <div>
                  <p className="font-playfair text-lg text-purple-primary mb-1">Importing Products...</p>
                  <p className="font-inter text-xs text-gray-400">{importedCount} of {parsedRows.length} products added</p>
                </div>

                {/* Progress Bar */}
                <div className="max-w-sm mx-auto">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-purple-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${importProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="font-inter text-xs text-gray-400 mt-2">{importProgress}%</p>
                </div>
              </div>
            )}

            {/* ═══ STEP 4: Done ═══ */}
            {step === 'done' && (
              <div className="py-6 text-center space-y-4">
                <CheckCircle size={48} className="mx-auto text-purple-primary" strokeWidth={1.5} />
                <div>
                  <p className="font-playfair text-xl text-purple-primary mb-1">Import Complete!</p>
                  <p className="font-inter text-sm text-gray-500">
                    {importedCount} of {parsedRows.length} products imported successfully
                  </p>
                </div>

                {failedRows.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-sm p-4 text-left max-h-40 overflow-y-auto mt-4">
                    <p className="font-inter text-xs font-medium text-red-600 mb-2">{failedRows.length} rows failed:</p>
                    <ul className="space-y-1">
                      {failedRows.map((f, i) => (
                        <li key={i} className="font-inter text-[11px] text-red-500">
                          Row {f.row} ({f.name}): {f.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={handleClose}
                  className="mt-4 px-8 py-3 bg-purple-primary text-white font-inter text-sm hover:bg-emerald-900 transition-colors rounded-sm"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
