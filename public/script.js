document.addEventListener('DOMContentLoaded', () => {
    console.log('Vision Astra v1.0 initialized.');
    
    // Add hover effects for feature cards
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            console.log(`Inspecting ${card.querySelector('h3').textContent}...`);
        });
    });

    // TODO: Smooth scroll implementation for anchor links (Feature request #106)
});
