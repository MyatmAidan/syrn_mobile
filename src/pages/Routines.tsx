import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonIcon, IonToast, IonModal, IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';
import { addOutline, trashOutline, timeOutline, checkmarkCircleOutline, listOutline } from 'ionicons/icons';
import { ApiService, Routine, Product } from '../services/apiService';
import './Routines.css';

const Routines: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create routine modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [routineTime, setRoutineTime] = useState<'Morning' | 'Evening'>('Morning');
  
  // Selected products for new routine
  const [selectedProductIds, setSelectedProductIds] = useState<Record<number, boolean>>({});
  const [productInstructions, setProductInstructions] = useState<Record<number, string>>({});

  // Toast notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  const fetchRoutinesData = async () => {
    setIsLoading(true);
    try {
      const apiRoutines = await ApiService.getRoutines();
      const apiProducts = await ApiService.getProducts();

      // Ensure steps inside API routines map their product models from the loaded products list
      const resolvedRoutines = apiRoutines.map((routine) => {
        if (routine.steps) {
          routine.steps = routine.steps.map((step) => ({
            ...step,
            product: apiProducts.find((p) => p.product_id === step.product_id)
          }));
        }
        return routine;
      });

      setRoutines(resolvedRoutines);
      setProductsList(apiProducts);
    } catch (error) {
      console.error('Error fetching routine resources:', error);
      setRoutines([]);
      setProductsList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutinesData();
  }, []);

  const handleDeleteRoutine = async (routineId: number) => {
    try {
      const res = await ApiService.deleteRoutine(routineId);
      if (res.success) {
        setRoutines(routines.filter((r) => r.routine_id !== routineId));
        setToastColor('success');
        setToastMessage('Routine deleted successfully.');
        setShowToast(true);
      } else {
        setToastColor('danger');
        setToastMessage(res.message || 'Failed to delete routine.');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error deleting routine:', error);
      setToastColor('danger');
      setToastMessage('Failed to delete routine.');
      setShowToast(true);
    }
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineName.trim()) {
      setToastColor('danger');
      setToastMessage('Please enter a routine name');
      setShowToast(true);
      return;
    }

    const stepsArray = Object.keys(selectedProductIds)
      .filter((pid) => selectedProductIds[parseInt(pid)])
      .map((pid, index) => {
        const idNum = parseInt(pid);
        return {
          product_id: idNum,
          step_order: index + 1,
          instruction: productInstructions[idNum] || 'Apply as directed.'
        };
      });

    setIsLoading(true);

    try {
      const res = await ApiService.createRoutine(routineName, routineTime, stepsArray);
      if (res.success && res.data) {
        const newRoutine = res.data;
        if (newRoutine.steps) {
          newRoutine.steps = newRoutine.steps.map((st) => ({
            ...st,
            product: productsList.find((p) => p.product_id === st.product_id)
          }));
        }
        setRoutines([...routines, newRoutine]);
        setToastColor('success');
        setToastMessage('Routine created successfully!');
        setShowToast(true);
        resetForm();
      } else {
        setToastColor('danger');
        setToastMessage(res.message || 'Failed to create routine.');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error posting routine:', error);
    } finally {
      setIsLoading(false);
      setShowCreateModal(false);
    }
  };

  const resetForm = () => {
    setRoutineName('');
    setRoutineTime('Morning');
    setSelectedProductIds({});
    setProductInstructions({});
  };

  const toggleProductSelect = (pid: number) => {
    setSelectedProductIds({
      ...selectedProductIds,
      [pid]: !selectedProductIds[pid]
    });
  };

  const handleInstructionChange = (pid: number, val: string) => {
    setProductInstructions({
      ...productInstructions,
      [pid]: val
    });
  };

  return (
    <IonPage>
      <IonHeader className="syrn-routines-header ion-no-border">
        <IonToolbar className="syrn-routines-toolbar">
          <IonTitle className="syrn-brand-font syrn-routines-title">my routines</IonTitle>
          <button
            type="button"
            slot="end"
            className="syrn-add-routine-btn"
            onClick={() => setShowCreateModal(true)}
            title="Create Routine"
          >
            <IonIcon icon={addOutline} />
          </button>
        </IonToolbar>
      </IonHeader>

      <IonContent className="syrn-routines-content" scrollY={true}>
        {isLoading ? (
          <div className="syrn-routines-spinner-container">
            <div className="syrn-spinner" />
          </div>
        ) : (
          <div className="syrn-routines-container">
            {routines.length === 0 ? (
              <div className="syrn-routines-empty">
                <IonIcon icon={listOutline} className="syrn-empty-icon" />
                <p>No routines created yet.</p>
                <button className="syrn-btn-primary" onClick={() => setShowCreateModal(true)}>
                  Create New Routine
                </button>
              </div>
            ) : (
              <div className="syrn-routines-list">
                {routines.map((routine) => (
                  <div key={routine.routine_id} className="syrn-routine-card">
                    {/* Routine Header */}
                    <div className="syrn-routine-card-header">
                      <div className="syrn-routine-title-info">
                        <IonIcon icon={timeOutline} className="syrn-time-icon" />
                        <div>
                          <h3 className="syrn-routine-name">{routine.routine_name}</h3>
                          <span className="syrn-routine-time-tag">{routine.routine_time}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="syrn-routine-delete-btn"
                        onClick={() => handleDeleteRoutine(routine.routine_id)}
                      >
                        <IonIcon icon={trashOutline} />
                      </button>
                    </div>

                    {/* Routine Steps */}
                    <div className="syrn-routine-steps">
                      {!routine.steps || routine.steps.length === 0 ? (
                        <p className="syrn-no-steps-text">No skincare products added to this routine yet.</p>
                      ) : (
                        routine.steps
                          .sort((a, b) => a.step_order - b.step_order)
                          .map((step) => (
                            <div key={step.step_id} className="syrn-routine-step-item">
                              <div className="syrn-step-badge">{step.step_order}</div>
                              <div className="syrn-step-details">
                                <span className="syrn-step-brand">{step.product?.brand?.brand_name || 'Syrn Skin'}</span>
                                <h4 className="syrn-step-product-name">
                                  {step.product?.product_name || 'Skincare Product'}
                                </h4>
                                {step.instruction && (
                                  <p className="syrn-step-instruction">{step.instruction}</p>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Routine Modal */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => { setShowCreateModal(false); resetForm(); }}>
          <div className="syrn-modal-container routines-modal-container">
            <h2 className="syrn-modal-title syrn-brand-font">New Skincare Routine</h2>
            
            <form onSubmit={handleCreateRoutine} className="syrn-modal-form">
              <div className="syrn-input-container">
                <label className="syrn-input-label">Routine Name</label>
                <div className="syrn-input-wrapper">
                  <input
                    type="text"
                    className="syrn-input-field"
                    placeholder="e.g., Morning Glow, Night Soothing"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="syrn-input-container">
                <label className="syrn-input-label">Time of Day</label>
                <IonSegment
                  value={routineTime}
                  onIonChange={(e) => setRoutineTime(e.detail.value as any)}
                  className="syrn-segment-selector"
                >
                  <IonSegmentButton value="Morning" className="syrn-segment-btn">
                    <IonLabel>Morning</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="Evening" className="syrn-segment-btn">
                    <IonLabel>Evening</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              </div>

              {/* Skincare Product Selection */}
              <div className="syrn-input-container products-selector-container">
                <label className="syrn-input-label">Add Products & Instructions</label>
                <div className="syrn-modal-products-list">
                  {productsList.map((prod) => {
                    const isSelected = !!selectedProductIds[prod.product_id];
                    return (
                      <div
                        key={prod.product_id}
                        className={`syrn-modal-product-select-card ${isSelected ? 'selected' : ''}`}
                      >
                        <div
                          className="syrn-product-select-header"
                          onClick={() => toggleProductSelect(prod.product_id)}
                        >
                          <div className="syrn-select-checkmark-box">
                            {isSelected && <IonIcon icon={checkmarkCircleOutline} className="syrn-select-check" />}
                          </div>
                          <div className="syrn-select-product-info">
                             <span className="syrn-select-brand">{prod.brand?.brand_name}</span>
                            <span className="syrn-select-name">{prod.product_name}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="syrn-product-instruction-input-container">
                            <input
                              type="text"
                              className="syrn-product-instruction-input"
                              placeholder="Instructions (e.g. Wash for 60s, Apply 3 drops)"
                              value={productInstructions[prod.product_id] || ''}
                              onChange={(e) => handleInstructionChange(prod.product_id, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="syrn-modal-actions">
                <button
                  type="button"
                  className="syrn-btn-text"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="syrn-btn-primary syrn-modal-submit-btn"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          color={toastColor}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default Routines;
