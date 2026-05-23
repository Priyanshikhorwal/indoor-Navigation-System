import React from 'react';
import { Navigation2, RotateCcw, Compass, MapPin, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const NavigationPanel = ({
    locations,
    source,
    destination,
    onSourceChange,
    onDestinationChange,
    onSubmit,
    onReset,
    loading,
    error,
    path,
    instructions,
    totalDistance,
    wheelchairAccessible,
    onWheelchairToggle,
    isSaved,
    onSaveFavorite
}) => {
    const isPathActive = path && path.length > 1;

    // Filter locations to select only those that have valid names and are not corridors (unless corridor has name)
    const selectableRooms = locations
        .filter(loc => loc.type !== 'CORRIDOR')
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="space-y-6">
            
            {/* Input Selection Card */}
            <div className="bg-white dark:bg-darkCard rounded-3xl shadow-md overflow-hidden border border-gray-150 dark:border-darkBorder">
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Navigation2 className="w-6 h-6 animate-pulse" />
                        <h1 className="text-lg font-black tracking-wide">Find Your Room</h1>
                    </div>
                    {(source || destination || isPathActive) && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="text-teal-100 hover:text-white flex items-center gap-1 text-xs border border-teal-400 hover:border-white px-2.5 py-1 rounded-xl transition-all font-bold active:scale-95"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Clear
                        </button>
                    )}
                </div>

                <div className="p-6">
                    <form onSubmit={onSubmit} className="space-y-5">
                        
                        {/* Source Select */}
                        <div>
                            <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                Start Location
                            </label>
                            <select
                                required
                                value={source}
                                onChange={(e) => onSourceChange(e.target.value)}
                                className="w-full p-3 border border-gray-200 dark:border-darkBorder dark:bg-darkBg dark:text-white rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-xs font-semibold cursor-pointer"
                            >
                                <option value="">Select starting room...</option>
                                {selectableRooms.map(loc => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name} {loc.floor && `(${loc.floor.floorName})`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Destination Select */}
                        <div>
                            <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                                Destination
                            </label>
                            <select
                                required
                                value={destination}
                                onChange={(e) => onDestinationChange(e.target.value)}
                                className="w-full p-3 border border-gray-200 dark:border-darkBorder dark:bg-darkBg dark:text-white rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-xs font-semibold cursor-pointer"
                            >
                                <option value="">Select destination room...</option>
                                {selectableRooms.map(loc => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name} {loc.floor && `(${loc.floor.floorName})`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Wheelchair Accessibility Toggle */}
                        <div className="flex items-center justify-between p-3 bg-teal-50/50 dark:bg-teal-950/10 rounded-2xl border border-teal-100/50 dark:border-teal-900/20">
                            <div className="text-left">
                                <p className="text-xs font-extrabold text-teal-950 dark:text-teal-200">Wheelchair Accessible</p>
                                <p className="text-[10px] text-teal-600/70 dark:text-teal-400/70 font-semibold mt-0.5">Use lift instead of stairs</p>
                            </div>
                            <button
                                type="button"
                                onClick={onWheelchairToggle}
                                className={`w-11 h-6 rounded-full transition-all duration-200 outline-none flex items-center px-1 border ${
                                    wheelchairAccessible
                                        ? 'bg-teal-600 border-teal-700 justify-end'
                                        : 'bg-gray-200 dark:bg-darkHover border-gray-300 dark:border-darkBorder justify-start'
                                }`}
                            >
                                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                            </button>
                        </div>

                        {error && (
                            <div className="text-rose-600 bg-rose-50/60 dark:bg-rose-950/20 p-3 rounded-2xl text-xs font-bold border border-rose-100/50 dark:border-rose-900/30">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !source || !destination}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-50 active:scale-[0.98] shadow-md shadow-teal-100 dark:shadow-none"
                        >
                            {loading ? 'Calculating Blueprint Route...' : 'Find Route'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Hint Box */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50/30 dark:from-teal-950/10 dark:to-emerald-950/5 p-4 rounded-3xl border border-teal-100/50 dark:border-teal-900/20 text-xs text-teal-950 dark:text-teal-200 leading-relaxed flex gap-3 shadow-sm">
                <Compass className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <span className="font-semibold">
                    <strong>Blueprint Tip:</strong> Click any room directly on the building map blueprint to select your source and destination instantly!
                </span>
            </div>

            {/* Stepper Timeline Guidance */}
            {isPathActive && (
                <div className="bg-white dark:bg-darkCard rounded-3xl shadow-md p-6 border border-gray-150 dark:border-darkBorder animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-sm font-black text-teal-950 dark:text-teal-200 flex items-center gap-2">
                            <MapPin className="text-teal-600 w-4 h-4" />
                            <span>Route Guidance</span>
                        </h2>
                        {totalDistance > 0 && (
                            <span className="bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-300 text-[10px] font-black px-2.5 py-1 rounded-full border border-teal-100 dark:border-teal-900/30">
                                Est: {totalDistance.toFixed(1)}m (~{Math.ceil(totalDistance / 1.4 / 60)} min)
                            </span>
                        )}
                    </div>

                    {/* Favorites Save */}
                    {localStorage.getItem('token') && localStorage.getItem('role') === 'ROLE_USER' ? (
                        <button
                            type="button"
                            onClick={onSaveFavorite}
                            disabled={isSaved}
                            className={`w-full py-2.5 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border mb-5 ${
                                isSaved
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300 cursor-default'
                                    : 'bg-white dark:bg-darkBg border-gray-200 dark:border-darkBorder hover:border-teal-600 text-teal-950 dark:text-white hover:bg-gray-50'
                            }`}
                        >
                            <Star className={`w-3.5 h-3.5 ${isSaved ? 'fill-emerald-600 text-emerald-600' : 'text-teal-600'}`} />
                            <span>{isSaved ? 'Route Pinned to Favorites!' : 'Pin Route to Favorites'}</span>
                        </button>
                    ) : !localStorage.getItem('token') ? (
                        <div className="bg-teal-50/50 dark:bg-teal-950/10 border border-teal-100/50 dark:border-teal-900/20 rounded-2xl p-4 mb-5 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs font-black text-teal-950 dark:text-teal-200">
                                <Star className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
                                <span>Pin Commute Route</span>
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-normal">
                                Log in or create a campus account to pin your favorite routes for quick access.
                            </p>
                            <Link
                                to="/login?tab=register"
                                className="text-[10px] font-black text-teal-600 hover:underline flex items-center gap-0.5 mt-0.5"
                            >
                                <span>Create Free Account</span>
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    ) : null}

                    {/* timeline */}
                    <div className="relative border-l-2 border-teal-100 dark:border-darkBorder ml-3.5 space-y-6">
                        {instructions.map((step, idx) => {
                            const isElevator = step.action === 'TAKE_ELEVATOR';
                            const isStairs = step.action === 'TAKE_STAIRS';
                            const isArrive = step.action === 'ARRIVE';

                            return (
                                <div key={idx} className="relative pl-6">
                                    {/* Indicator Bullet */}
                                    <div
                                        className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-darkBg ${
                                            idx === 0
                                                ? 'bg-emerald-500 shadow-sm shadow-emerald-200'
                                                : isArrive
                                                ? 'bg-teal-600 shadow-sm shadow-teal-200'
                                                : isElevator || isStairs
                                                ? 'bg-purple-500'
                                                : 'bg-teal-500'
                                        }`}
                                    ></div>

                                    {/* Floor transition cards */}
                                    {(isElevator || isStairs) ? (
                                        <div className="bg-purple-50/60 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/20 rounded-2xl p-3 flex items-center gap-3 animate-in fade-in duration-200">
                                            <div className="text-[10px] font-black text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-1 rounded-xl">
                                                {isElevator ? 'LIFT' : 'STAIRS'}
                                            </div>
                                            <div className="text-xs font-black text-purple-950 dark:text-purple-200">
                                                {step.instruction}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-xs font-black text-gray-800 dark:text-gray-200">{step.instruction}</p>
                                            {step.floor && (
                                                <span className="inline-block mt-1 text-[9px] font-black bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                    {step.floor}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NavigationPanel;
