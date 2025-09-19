import IngredientTabs from './IngredientTabs';

const IngredientSelector = ({ ingredients, setIngredients, disabled, onAddIngredient, onRemoveIngredient }) => {
  return (
    <IngredientTabs
      ingredients={ingredients}
      setIngredients={setIngredients}
      disabled={disabled}
      onAddIngredient={onAddIngredient}
      onRemoveIngredient={onRemoveIngredient}
    />
  );
};

export default IngredientSelector;
