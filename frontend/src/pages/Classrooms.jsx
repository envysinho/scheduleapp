import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, X, LayoutGrid, List, ChevronDown } from 'lucide-react';
import '../styles/classrooms.css';

const stats = [
  { label: 'CAPACIDAD TOTAL', number: '1000', unit: 'estudiantes' },
  { label: 'ESPACIOS OCUPADOS', number: '5', unit: 'espacios' },
  { label: 'MANTENIMIENTO', number: '3', unit: 'reportes' },
  { label: 'ESPACIOS LIBRES', number: '12', unit: 'espacios' },
];

const INITIAL_CLASSROOMS = [
  { id: 1, name: 'Aula 101', capacity: 30, floor: 1, building: 'A', type: 'aula', status: 'libre' },
  { id: 2, name: 'Aula 102', capacity: 40, floor: 1, building: 'A', type: 'aula', status: 'ocupada' },
  { id: 3, name: 'Aula 201', capacity: 35, floor: 2, building: 'A', type: 'aula', status: 'libre' },
  { id: 4, name: 'Aula 202', capacity: 45, floor: 2, building: 'B', type: 'aula', status: 'mantenimiento' },
  { id: 5, name: 'Aula 301', capacity: 50, floor: 3, building: 'B', type: 'aula', status: 'ocupada' },
  { id: 6, name: 'Lab 101', capacity: 20, floor: 1, building: 'C', type: 'laboratorio', status: 'libre' },
  { id: 7, name: 'Lab 102', capacity: 25, floor: 1, building: 'C', type: 'laboratorio', status: 'ocupada' },
  { id: 8, name: 'Lab 201', capacity: 22, floor: 2, building: 'C', type: 'laboratorio', status: 'libre' },
  { id: 9, name: 'Lab 202', capacity: 18, floor: 2, building: 'D', type: 'laboratorio', status: 'mantenimiento' },
  { id: 10, name: 'Lab 301', capacity: 24, floor: 3, building: 'D', type: 'laboratorio', status: 'ocupada' },
  { id: 11, name: 'Lab 302', capacity: 20, floor: 3, building: 'D', type: 'laboratorio', status: 'libre' },
  { id: 12, name: 'Lab 401', capacity: 16, floor: 4, building: 'E', type: 'laboratorio', status: 'mantenimiento' },
  { id: 13, name: 'Lab 402', capacity: 18, floor: 4, building: 'E', type: 'laboratorio', status: 'libre' },
];

const LOCATION_OPTIONS = [
  { value: 'all', label: 'Todos los espacios' },
  { value: 'aula', label: 'Aulas' },
  { value: 'laboratorio', label: 'Laboratorios' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'libre', label: 'Libres' },
  { value: 'ocupada', label: 'Ocupadas' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
];

const BUILDING_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
];

const STATUS_LABELS = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  mantenimiento: 'Mantenimiento',
};

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function DropdownSelect({ value, options, onChange, placeholder, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLabel = options.find((o) => o.value === value)?.label ?? placeholder ?? '';
  const isPlaceholder = !value && placeholder;

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div className={`dropdown ${className}`.trim()} ref={ref}>
      <button
        type="button"
        className={`dropdown-btn${isPlaceholder ? ' is-placeholder' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        {activeLabel}
        <ChevronDown size={16} className={open ? 'chevron-open' : ''} />
      </button>
      {open && (
        <div className="dropdown-menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`dropdown-option${value === option.value ? ' active' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Classrooms() {
  const [classrooms, setClassrooms] = useState(INITIAL_CLASSROOMS);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', capacity: '', floor: '', building: '' });
  const [viewMode, setViewMode] = useState('grid');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredClassrooms = classrooms.filter((c) => {
    const matchesLocation = locationFilter === 'all' || c.type === locationFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesLocation && matchesStatus;
  });

  const handleAddClick = () => {
    setFormData({ name: '', capacity: '', floor: '', building: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (classroom) => {
    setFormData(classroom);
    setEditingId(classroom.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setClassrooms(classrooms.filter((c) => c.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setClassrooms(classrooms.map((c) => (c.id === editingId ? { ...formData, id: editingId } : c)));
    } else {
      setClassrooms([
        ...classrooms,
        { ...formData, id: Date.now(), type: 'aula', status: 'libre' },
      ]);
    }
    setShowForm(false);
    setFormData({ name: '', capacity: '', floor: '', building: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const renderCard = (classroom) => (
    <div key={classroom.id} className="classroom-card">
      <div className="card-header">
        <div className="card-title-row">
          <h3>{classroom.name}</h3>
          <StatusBadge status={classroom.status} />
        </div>
        <div className="card-actions">
          <button className="btn-icon" onClick={() => handleEdit(classroom)}>
            <Edit2 size={16} />
          </button>
          <button className="btn-icon btn-danger" onClick={() => handleDelete(classroom.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="card-body">
        <p><strong>Capacidad:</strong> {classroom.capacity} estudiantes</p>
        <p><strong>Ubicación:</strong> Pabellón {classroom.building}, Piso {classroom.floor}</p>
        <p><strong>Tipo:</strong> {classroom.type === 'aula' ? 'Aula' : 'Laboratorio'}</p>
      </div>
    </div>
  );

  const renderRow = (classroom) => (
    <div key={classroom.id} className="classroom-row">
      <div className="classroom-row-info">
        <div className="classroom-row-main">
          <h3>{classroom.name}</h3>
          <StatusBadge status={classroom.status} />
        </div>
        <div className="classroom-row-details">
          <span>{classroom.capacity} estudiantes</span>
          <span>Pabellón {classroom.building}, Piso {classroom.floor}</span>
          <span>{classroom.type === 'aula' ? 'Aula' : 'Laboratorio'}</span>
        </div>
      </div>
      <div className="card-actions">
        <button className="btn-icon" onClick={() => handleEdit(classroom)}>
          <Edit2 size={16} />
        </button>
        <button className="btn-icon btn-danger" onClick={() => handleDelete(classroom.id)}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="view-container">
      <div className="classrooms-header">
        <h1>Gestión de Aulas</h1>
        <button className="btn-primary" onClick={handleAddClick}>
          <Plus size={18} /> Nueva Aula
        </button>
      </div>

      <div className="classrooms-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-box">
            <span className="stat-label">{stat.label}</span>
            <div className="stat-value">
              <span className="stat-number">{stat.number}</span>
              <span className="stat-unit">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="classrooms-toolbar">
        <div className="view-toggle">
          <button
            type="button"
            className={`view-toggle-btn${viewMode === 'grid' ? ' active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Vista en cuadrícula"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            type="button"
            className={`view-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="Vista en lista"
          >
            <List size={18} />
          </button>
        </div>

        <DropdownSelect
          value={locationFilter}
          options={LOCATION_OPTIONS}
          onChange={setLocationFilter}
        />

        <DropdownSelect
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
        />
      </div>

      {showForm && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <div className="modal-content" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Aula' : 'Nueva Aula'}</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre del Aula</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Aula 101"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Capacidad</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    placeholder="30"
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Piso</label>
                  <input
                    type="number"
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    placeholder="1"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Pabellón</label>
                  <input type="hidden" name="building" value={formData.building} required />
                  <DropdownSelect
                    value={formData.building}
                    options={BUILDING_OPTIONS}
                    placeholder="Selecciona"
                    onChange={(v) => setFormData((prev) => ({ ...prev, building: v }))}
                    className="dropdown--form"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={viewMode === 'grid' ? 'classrooms-grid' : 'classrooms-list'}>
        {filteredClassrooms.length === 0 ? (
          <div className="empty-state">
            <p>No hay espacios que coincidan con los filtros</p>
            {classrooms.length === 0 && (
              <button className="btn-primary" onClick={handleAddClick}>
                Crear Primera Aula
              </button>
            )}
          </div>
        ) : (
          filteredClassrooms.map((classroom) =>
            viewMode === 'grid' ? renderCard(classroom) : renderRow(classroom)
          )
        )}
      </div>
    </div>
  );
}

export default Classrooms;
