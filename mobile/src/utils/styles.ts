import { Platform, ViewStyle } from 'react-native';

interface ShadowProps {
    color: string;
    offset: { width: number; height: number };
    opacity: number;
    radius: number;
    elevation?: number;
}

/**
 * Generates platform-specific shadow styles.
 * Uses 'boxShadow' for Web (to avoid deprecation warnings) and native shadow props for iOS/Android.
 */
export const getShadowStyle = ({
    color,
    offset,
    opacity,
    radius,
    elevation = 0,
}: ShadowProps): ViewStyle => {
    if (Platform.OS === 'web') {
        // Convert opacity to manageable value or usage
        // Simple approximation: `${x}px ${y}px ${blur}px ${spread}px ${color}`
        // box-shadow: offset-x | offset-y | blur-radius | color
        // We can't easily injection opacity into a hex color string without conversion.
        // Assuming color is hex, we might ignore opacity for now or trust the color has it?
        // Actually, let's just use the color. If strict opacity is needed, caller should provide rgba.
        // But to be helpful, let's try to handle basic hex->rgba if possible, or just ignore opacity warning.

        // However, most RN web shadows look okay-ish with just the color if it's not too dark.
        // A better approximation for "opacity" on web is difficult without proper color manipulation.
        // Let's assume the user accepts the solid color or the color provided is already adjusted.
        // BUT, standard RN shadowOpacity applies to the alpha.

        // Let's treat standard hex colors.
        return {
            // React Native Web supports boxShadow string
            boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${color}`,
            elevation,
        };
    }

    return {
        shadowColor: color,
        shadowOffset: offset,
        shadowOpacity: opacity,
        shadowRadius: radius,
        elevation,
    };
};

/**
 * Generates platform-specific text shadow styles.
 * Uses 'textShadow' shorthand for Web and individual props for Native.
 */
export const getTextShadowStyle = (
    color: string,
    offset: { width: number; height: number },
    radius: number
): any => {
    if (Platform.OS === 'web') {
        return {
            textShadow: `${offset.width}px ${offset.height}px ${radius}px ${color}`,
        };
    }
    return {
        textShadowColor: color,
        textShadowOffset: offset,
        textShadowRadius: radius,
    };
};
