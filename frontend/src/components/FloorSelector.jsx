import React from 'react';

const FloorSelector = ({ floors, selectedFloorId, onFloorSelect }) => {
    // Sort floors by floor number ascending (Ground, First, Second)
    const sortedFloors = [...floors].sort((a, b) => a.floorNumber - b.floorNumber);

    return (
        <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 dark:bg-darkHover rounded-2xl border border-gray-200 dark:border-darkBorder shadow-inner">
            <button
                type="button"
                onClick={() => onFloorSelect('All')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    selectedFloorId === 'All'
                        ? 'bg-teal-600 text-white shadow-md transform scale-105'
                        : 'text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-white hover:bg-white dark:hover:bg-darkCard'
                }`}
            >
                All Floors
            </button>
            {sortedFloors.map((floor) => (
                <button
                    type="button"
                    key={floor.id}
                    onClick={() => onFloorSelect(floor.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        selectedFloorId === floor.id
                            ? 'bg-teal-600 text-white shadow-md transform scale-105'
                            : 'text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-white hover:bg-white dark:hover:bg-darkCard'
                    }`}
                >
                    {floor.floorName}
                </button>
            ))}
        </div>
    );
};

export default FloorSelector;
