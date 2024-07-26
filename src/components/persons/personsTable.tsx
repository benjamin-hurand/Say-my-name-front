import { useState, useEffect } from "react";
import { getPersons } from "../../services/business/persons/person.service";
import { Person } from "../../models/commons/Person";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from "@mui/material";

export const PersonsTable = () => {
    const [persons, setPersons] = useState<Person[]>([]);
    

    // Function to fetch persons from API
    const fetchPersons = async () => {
        try {
            const fetchedData: Person[] = await getPersons();
            if (fetchedData && Array.isArray(fetchedData)) {
                setPersons(fetchedData.map((person) => ({
                    ...person,
                    id: person.id,
                    firstName: person.firstName,
                    lastName: person.lastName,
                    user: person.user,
                    promotions: person.promotions,
                    attributes: person.attributes
                }))); 
            }
        } catch (err: unknown) {
            console.error("Error fetching Persons:", err);
        }
    };

    useEffect(() => {
        fetchPersons();
    }, []);

    return (
        <TableContainer component={Paper}>
            <Typography variant="h6" component="div" style={{ padding: "16px" }}>
                Persons List
            </Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>First Name</TableCell>
                        <TableCell>Last Name</TableCell>
                        <TableCell>Username</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Attributes</TableCell>
                        <TableCell>Promotions</TableCell>

                    </TableRow>
                </TableHead>
                <TableBody>
                    {persons.map((person) => (
                        <TableRow key={person.id}>
                            <TableCell>{person.firstName}</TableCell>
                            <TableCell>{person.lastName}</TableCell>
                            <TableCell>{person.user ? person.user.username : 'N/A'}</TableCell>
                            <TableCell>{person.user ? person.user.email : 'N/A'}</TableCell>
                            <TableCell>
                                {person.attributes && person.attributes.length > 0 ? (
                                    person.attributes.map((attribute, index) => (
                                        <div key={index}>{attribute.attribute.name}</div>
                                    ))
                                ) : (
                                    'N/A'
                                )}
                            </TableCell>
                            <TableCell>
                                {person.promotions && person.promotions.length > 0 ? (
                                    person.promotions.map((promotion, index) => (
                                        <div key={index}>{promotion.promotion.name}</div>
                                    ))
                                ) : (
                                    'N/A'
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};
